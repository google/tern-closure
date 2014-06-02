'use strict';

var infer = require('tern/lib/infer');

var Weight = {
  TEMP_OBJ: 40,
  TEMP_CTOR: 50
}

/**
 * A class for managing Closure types.
 */
var TypeManager = function() {};
module.exports = TypeManager;


/**
 * Gets an AVal for a type, given its qualified name. Creates stand-in
 * AVals for types and namespaces that have not been defined yet.
 * @param {string} name The type name.
 * @param {infer.AVal=} innerType In the case of a type application, the
 *     applied type.
 * @return {!infer.AVal}
 */
TypeManager.prototype.getQualifiedType = function (name, innerType) {
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
  var ctorType = this.defineQualifiedName(name);
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
TypeManager.prototype.defineQualifiedName = function(name) {
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
