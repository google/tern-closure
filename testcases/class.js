// Test inference with a Closure-style class.
// plugin=closure
// plugin=doc_comment null

goog.provide('name.space.Class');

/**
 * A test class.
 * @param {number} first The first argument.
 * @constructor
 */
name.space.Class = function(first) {
  first; //: number
  first; //doc: The first argument.

  /** @private {Property} The property. */
  this.myProperty = getProperty();

  /** @protected {Blah} The protected blah. */
  this.myBlah = getBlah();

  this.myMethod; //: fn(param: Blah) -> string
  this.myMethod; //doc: A method for this test class.
  this.myMethod(); //doc: The return value.
};


/**
 * A method for this test class.
 * @param {Blah} param The method parameter.
 * @return {string} The return value.
 */
name.space.Class.prototype.myMethod = function(param) {
  param; //: Blah
  param; //doc: The method parameter.

  this.m; //+ myBlah, myMethod, myProperty @8
  this.myProperty; //: Property
  this.myProperty; //doc: The property.
  this.myBlah; //: Blah
  this.myBlah; //doc: The protected blah.
  return typelessVal;
}

var instance = new name.space.Class();
instance.myProperty; //: Property
instance.myBlah; //: Blah
instance.myMethod; //: fn(param: Blah) -> string

/** @type {name.space.Class} */
var instance2;
instance2.myProperty; //: Property
instance2.myBlah; //: Blah
instance2.myMethod; //: fn(param: Blah) -> string
