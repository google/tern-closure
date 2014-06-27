// Test inference with a class with a constructed constructor.
// plugin=closure
// plugin=doc_comment null

goog.provide('ConstructedClass');

/**
 * A test class with a constructed constructor.
 * @param {Property} first The first argument.
 * @constructor
 */
ConstructedClass = ctorCtor();

/**
 * A method for this test class.
 * @param {Property} param The method parameter.
 * @return {ReturnType} The return value.
 */
ConstructedClass.prototype.myMethod = function(param) {
  this.myProperty = param;
  this.myBlah; //: Blah
  return typelessVal;
}

/**
 * A method for this test class.
 * @param {Blah} blah The blah
 */
ConstructedClass.prototype.yourMethod = function(blah) {
  this.myProperty; //: Property
  this.myBlah = blah;
}

var instance = new ConstructedClass();
// TODO: Fix instance type names for constructed constructors.
instance; //: {myBlah, myProperty}
instance.myProperty; //: Property
instance.myBlah; //: Blah
instance.myMethod; //: fn(param: Property) -> ReturnType

/** @type {ConstructedClass} */
var instance2;
instance2.myProperty; //: Property
instance2.myBlah; //: Blah
instance2.myMethod; //: fn(param: Property) -> ReturnType
