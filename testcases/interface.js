// Test inference using interfaces.
// plugin=closure
// plugin=doc_comment null

goog.provide('Interface');
goog.provide('Implementor');

/**
 * The interface.
 * @interface
 */
Interface = function() {};

/**
 * An interface method.
 * @param {ParamType} param The param.
 * @return {ReturnType} The retval.
 */
Interface.prototype.method;

Interface.prototype.method; //: fn(param: ParamType) -> ReturnType

/** @type {Interface} */
var instance;
instance; //: Interface
instance.method; //: fn(param: ParamType) -> ReturnType

/**
 * A class implementing Interface.
 * @constructor
 * @struct
 * @implements {Interface}
 */
Implementor = function() {};

/** @override */
Implementor.prototype.method = function(param) {
  param; //: ParamType
  return notaval;
};
Implementor.prototype.method; //: fn(param: ParamType) -> ReturnType
