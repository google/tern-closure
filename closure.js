'use strict';
var infer = require('tern/lib/infer');
var tern = require('tern/lib/tern');
var comment = require('tern/lib/comment');
var walk = require('acorn/util/walk');
var doctrine = require('doctrine');

var Weight = {
  TEMP_OBJ: 40,
  TEMP_CTOR: 50
}


tern.registerPlugin('closure', function() {
  var defs = {
    '!name': 'closure',
    goog: {
      provide: 'fn(name: string) -> !custom:closureProvide',
      require: 'fn(name: string) -> !custom:closureRequire'
    },
  };

  return {
    passes: {
      'postParse': postParse,
      'postInfer': postInfer
    },
    defs: defs
  };
});


infer.registerFunction('closureProvide', function(_self, args, argNodes) {
  if (!argNodes || !argNodes.length || argNodes[0].type != "Literal" ||
      typeof argNodes[0].value != "string")
    return infer.ANull;
  defineQualifiedName(argNodes[0].value);
  return infer.ANull;
});


infer.registerFunction('closureRequire', function(_self, args, argNodes) {
  if (!argNodes || !argNodes.length || argNodes[0].type != "Literal" ||
      typeof argNodes[0].value != "string")
    return infer.ANull;
  defineQualifiedName(argNodes[0].value);
  return infer.ANull;
});


/**
 * Walks the syntax tree after the Acorn parsing pass, parsing JSDoc comments
 * and attaching them to their corresponding nodes.
 * @param {!acorn.Node} ast
 * @param {string} text The file text.
 */
function postParse(ast, text) {
  function attachComments(node) {
    // TODO: Do our own comment-finding, handling casts.
    var comments = comment.commentsBefore(text, node.start);
    if (comments) {
      node._closureComment = doctrine.parse(
          '/*' + comments[comments.length - 1] + '*/',
          {unwrap: true});
    }
  }

  // TODO: Handle property declarations with no initialization, e.g.
  // /** @type {BlahType} */ 
  // Class.prototype.blah;
  walk.simple(ast, {
    VariableDeclaration: attachComments,
    FunctionDeclaration: attachComments,
    AssignmentExpression: function(node) {
      if (node.operator == '=') {
        attachComments(node);
      }
    },
    ObjectExpression: function(node) {
      for (var i = 0; i < node.properties.length; ++i) {
        attachComments(node.properties[i].key);
      }
    }
  });
}


/**
 * Applies type information from JSDoc comments to the initialized values after
 * Tern's type inference pass.
 * @param {!acorn.Node} ast
 * @param {!infer.Scope} scope
 */
function postInfer(ast, scope) {
  walk.simple(ast, {
    VariableDeclaration: function(node, scope) {
      interpretComments(node, node._closureComment,
          scope.getProp(node.declarations[0].id.name));
    },
    FunctionDeclaration: function(node, scope) {
      interpretComments(
          node, node._closureComment, scope.getProp(node.id.name));
    },
    AssignmentExpression: function(node, scope) {
      interpretComments(node, node._closureComment,
          infer.expressionType({node: node.left, state: scope}));
    },
    ObjectExpression: function(node, scope) {
      for (var i = 0; i < node.properties.length; ++i) {
        var prop = node.properties[i], key = prop.key;
        interpretComments(
            prop, key._closureComment, node.objType.getProp(key.name));
      }
    }
  }, infer.searchVisitor, scope);
}


/**
 * Interpret the comments before an expression and apply type information from
 * the comments.
 * @param {!acorn.Node} node An Acorn AST node.
 * @param {{description: string, tags: Array}} comment The Doctrine-parsed
 *     comment before the node if present.
 * @param {!infer.AVal} aval An abtract type value to which type information
 *     should be applied.
 */
function interpretComments(node, comment, aval) {
  if (!comment) {
    return;
  }
  // TODO: Refactor to have an object representation of the comment info.
  var valueType, valueDoc;
  var argTypes, returnType;
  var argDocs, returnDoc;
  var superType;
  for (var i = 0; i < comment.tags.length; i++) {
    var tag = comment.tags[i];
    var type;
    if (tag.type) {
      type = getExpressionAval(tag.type);
    }
    // TODO: Handle many other tags (inherits, implements, typedef, override...)
    switch (tag.title) {
      case 'type': case 'private': case 'protected': case 'public':
        // TODO: Add completion filtering based on access restrictions?
        valueType = type;
        valueDoc = tag.description;
        break;
      case 'return': case 'returns':
        returnType = type;
        returnDoc = tag.description;
        break;
      case 'param': case 'arg': case 'argument':
        (argTypes || (argTypes = Object.create(null)))[tag.name] = type;
        (argDocs || (argDocs = Object.create(null)))[tag.name] =
            tag.description;
        break;
      case 'extends':
        superType = type;
        break;
    }
  }
  // TODO: If we have function-specific type info, force the right hand side
  // to be a function AVal (i.e. assume RHS evaluates to function).
  var fnType = getFnType(node);
  if (fnType) {
    // This comment applies to a function, and we have information to apply
    // to that function type.
    applyFnTypeInfo(
        fnType, argTypes, argDocs, returnType, returnDoc, superType);
    if (comment.description) {
      fnType.doc = comment.description;
    }
  } else if (valueType) {
    // This comment applies to a variable or property.
    valueType.propagate(aval);
    setDoc(aval, comment.description || valueDoc);
  }
}


/**
 * Applies the given argument and return type information to the given function
 * type.
 * @param {!infer.Fn} fnType The function type to propagate to.
 * @param {Object.<infer.AVal>} argTypes A map of argument names to parsed
 *     types.
 * @param {Object.<string>} argDocs Doc comments for the arguments.
 * @param {infer.AVal} returnType The parsed return type.
 * @param {string} returnDoc Doc comments for the return value.
 * @param {infer.AVal} supterType The type of the superclass, if any.
 */
function applyFnTypeInfo(
    fnType, argTypes, argDocs, returnType, returnDoc, superType) {
  if (argTypes) {
    for (var i = 0; i < fnType.argNames.length; i++) {
      var name = fnType.argNames[i];
      var docArgType = argTypes[name];
      // Propagate the documented type info to the inferred argument type.
      if (docArgType) {
        docArgType.propagate(fnType.args[i]);
        setDoc(fnType.args[i], argDocs[name]);
      }
    }
  }
  // Propagate any return type info.
  if (returnType) {
    returnType.propagate(fnType.retval);
    setDoc(fnType.retval, returnDoc);
  }
  if (superType && fnType.hasProp('prototype', false)) {
    superType.propagate(new IsSuperclassInstance(fnType));
  }
}


/**
 * Recursively process a JSDoc type expression to assemble a corresponding AVal.
 * @param {{type: string}} typeExpr A Doctrine parsed type expression.
 * @param {infer.AVal=} innerType The inner type, for type applications.
 * @return {infer.AVal} An abstract value for the type expression.
 */
function getExpressionAval(typeExpr, innerType) {
  var t;
  switch (typeExpr.type) {
    case doctrine.Syntax.NameExpression:
      return getQualifiedType(typeExpr.name, innerType);
    case doctrine.Syntax.NullableType:
    case doctrine.Syntax.NonNullableType:
      // TODO: Expose nullability information.
      return getExpressionAval(typeExpr.expression, innerType);
    case doctrine.Syntax.OptionalType:
      // TODO: Expose optional param information (orthogonal to nullability).
      return getExpressionAval(typeExpr.expression, innerType);
    case doctrine.Syntax.UnionType:
      // TODO: Decide if this behaves better with a custom synthetic 'Union'
      // type.
      var aval = new infer.AVal();
      typeExpr.elements.forEach(function(subExpr) {
        if (t = getExpressionAval(subExpr, innerType)) {
          aval.addType(t);
        }
      });
      return aval;
    case doctrine.Syntax.RestType:
      // TODO: Expose varargs.
      return getExpressionAval(typeExpr.expression, innerType);
    case doctrine.Syntax.RecordType:
    case doctrine.Syntax.FieldType:
      // TODO: Handle records.
      return null;
    case doctrine.Syntax.FunctionType:
      // TODO: Handle functions.
      return null;
    case doctrine.Syntax.TypeApplication:
      // TODO: Handle more exotic type applications?
      // We support type applications for array and object values. In those
      // cases, only the last applied type (the value type) is meaningful.
      return getExpressionAval(typeExpr.expression, getExpressionAval(
          typeExpr.applications[typeExpr.applications.length - 1], innerType));
    case doctrine.Syntax.NullLiteral:
    case doctrine.Syntax.UndefinedLiteral:
      return infer.ANull;
    case doctrine.Syntax.NullableLiteral:
    case doctrine.Syntax.AllLiteral:
    case doctrine.Syntax.VoidLiteral:
      // No type to apply.
      return null;
    default:
      console.log('Unknown expression type: ' + typeExpr.type);
      return null;
  }
}


/**
 * Gets an AVal for a type, given its qualified name. Creates stand-in
 * AVals for types and namespaces that have not been defined yet.
 * @param {string} name The type name.
 * @param {infer.AVal=} innerType In the case of a type application, the
 *     applied type.
 * @return {!infer.AVal}
 */
function getQualifiedType(name, innerType) {
  // Handle primitives.
  if (/^(number|integer)$/i.test(name)) {
    return infer.cx().num;
  }
  if (/^bool(ean)?$/i.test(name)) {
    return infer.cx().bool;
  }
  if (/^string$/i.test(name)) {
    return infer.cx().str;
  }
  if (/^array$/i.test(name)) {
    return new infer.Arr(innerType);
  }
  if (/^object$/i.test(name)) {
    var objType = new infer.Obj(true /* null proto */);
    if (innerType) {
      innerType.propagate(objType.defProp("<i>"));
    }
    return objType;
  }

  // This is a class instance.
  var ctorType = defineQualifiedName(name);
  if (!(ctorType.getType() instanceof infer.Fn)) {
    // Create a fake constructor function to stand in for the real one.
    var fakeFnType = new infer.Fn(name, infer.ANull /* self */, [] /* args */,
        [] /* argNames */, infer.ANull /* retVal */);
    // Propagate it with reduced weight so it will be overriden if the real
    // constructor function loads.
    fakeFnType.propagate(ctorType, Weight.TEMP_CTOR);
  }

  var type = new infer.AVal();
  // Say that the final property type is the constructor of the commented value.
  ctorType.propagate(new infer.IsCtor(type));
  return type;
}


/**
 * Defines the given fully-qualified name as a property on the global scope. If
 * any part of the name is already defined, uses the existing value.
 * @param {string} name
 * @return {AVal} The abstract value for the name.
 */
function defineQualifiedName(name) {
  // TODO: Deal with goog.scope.
  // TODO: Put in temp origin nodes?
  var parts = name.split('.');
  var base = infer.cx().topScope;
  for (var i = 0; i < parts.length; i++) {
    var prop = base.defProp(parts[i]); 
    if (prop.getType()) {
      base = prop.getType();
    } else {
      base = new infer.Obj(true, parts.slice(0, i + 1).join('.'));
      base.propagate(prop, Weight.TEMP_OBJ);
    }
  }
  return prop;
}


/**
 * If the given node is associated with a function, gets the type value for the
 * function.
 * @param {!acorn.Node} node
 * @return {infer.Fn}
 */
function getFnType(node) {
  if (node.type == "VariableDeclaration") {
    var decl = node.declarations[0];
    if (decl.init && decl.init.type == "FunctionExpression") {
      return decl.init.body.scope.fnType;
    }
  } else if (node.type == "FunctionDeclaration") {
    return node.body.scope.fnType;
  } else if (node.type == "AssignmentExpression" &&
      node.right.type == "FunctionExpression") {
    return node.right.body.scope.fnType;
  } else if (node.value && node.value.type == "FunctionExpression") {
    // Object property.
    return node.value.body.scope.fnType;
  }
  return null;
}


/**
 * Sets the doc property for a type, but only if it is not a type literal (a doc
 * set on a type literal will be associated with all values of that type).
 * TODO: Consider indirection of type literals through AVals to store docs.
 * @param {(infer.AVal|infer.ANull|infer.Type)} type
 * @param {string} doc
 */
function setDoc(type, doc) {
  if (type instanceof infer.AVal) {
    type.doc = doc;
  }
};


/**
 * A constraint for specifying that an AVal is the instance of the superclass of
 * the target function type (i.e. the AVal object type should be used as the
 * function's prototype's proto).
 */
var IsSuperclassInstance = infer.constraint('targetFn', {
  addType: function(newProto, weight) {
    // TODO: Handle if target prototype AVal changes by keeping the last added
    // proto and applying it to the new type.
    if (!(newProto instanceof infer.Obj) ||
        !this.targetFn.hasProp('prototype', false)) {
      return;
    }
    var targetPrototype = this.targetFn.getProp('prototype').getType();
    if (!(targetPrototype instanceof infer.Obj)) {
      console.log('Forcing proto on non-object!');
      return;
    }
    // Detach the old proto and replace it with the new one.
    targetPrototype.proto.unregPropHandler(targetPrototype);
    targetPrototype.proto = newProto;
    targetPrototype.proto.forAllProps(targetPrototype);
    targetPrototype.maybeUnregProtoPropHandler();
  }
});
