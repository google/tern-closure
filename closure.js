'use strict';
var infer = require('tern/lib/infer');
var tern = require('tern/lib/tern');
var getCommentsBefore = require('tern/lib/comment').commentsBefore;
var walk = require('acorn/util/walk');
var Comment = require('./lib/comment');
var TypeManager = require('./lib/typemanager');

var typeManager = new TypeManager();


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
  typeManager.defineQualifiedName(argNodes[0].value);
  return infer.ANull;
});


infer.registerFunction('closureRequire', function(_self, args, argNodes) {
  if (!argNodes || !argNodes.length || argNodes[0].type != "Literal" ||
      typeof argNodes[0].value != "string")
    return infer.ANull;
  typeManager.defineQualifiedName(argNodes[0].value);
  return infer.ANull;
});


/**
 * Walks the syntax tree after the Acorn parsing pass, finding comments and
 * attaching them to their corresponding nodes.
 * @param {!acorn.Node} ast
 * @param {string} text The file text.
 */
function postParse(ast, text) {
  function attachComments(node) {
    // TODO: Do our own comment-finding, handling casts.
    var comments = getCommentsBefore(text, node.start);
    if (comments) {
      node._closureComment =
          new Comment('/*' + comments[comments.length - 1] + '*/');
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
 * @param {Comment} comment The comment info.
 *     comment before the node if present.
 * @param {!infer.AVal} aval An abtract type value to which type information
 *     should be applied.
 */
function interpretComments(node, comment, aval) {
  if (!comment) {
    return;
  }
  comment.parse(typeManager);
  // TODO: If we have function-specific type info, force the right hand side
  // to be a function AVal (i.e. assume RHS evaluates to function).
  var fnType = getFnType(node);
  if (fnType) {
    applyFnTypeInfo(fnType, comment);
    if (comment.description) {
      fnType.doc = comment.description;
    }
  } else if (comment.valueType) {
    // This comment applies to a variable or property.
    comment.valueType.propagate(aval);
    setDoc(aval, comment.description || comment.valueDoc);
  }
}


/**
 * Applies the given argument and return type information to the given function
 * type.
 * @param {!infer.Fn} fnType The function type to propagate to.
 * @param {!Comment} comment The comment type info.
 */
function applyFnTypeInfo(fnType, comment) {
  if (comment.argTypes) {
    for (var i = 0; i < fnType.argNames.length; i++) {
      var name = fnType.argNames[i];
      var argType = comment.argTypes[name];
      // Propagate the documented type info to the inferred argument type.
      if (argType) {
        argType.propagate(fnType.args[i]);
        setDoc(fnType.args[i], comment.argDocs[name]);
      }
    }
  }
  // Propagate any return type info.
  if (comment.returnType) {
    comment.returnType.propagate(fnType.retval);
    setDoc(fnType.retval, comment.returnDoc);
  }
  if (comment.superType && fnType.hasProp('prototype', false)) {
    comment.superType.propagate(new IsSuperclassInstance(fnType));
  }
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
