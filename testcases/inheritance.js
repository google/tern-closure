// Test inference with inherited methods and properties.
// plugin=closure
// plugin=doc_comment null

goog.provide('name.space.Parent');
goog.provide('name.space.Child');
goog.provide('name.space.Grandchild');
goog.provide('name.space.Sibling');

/**
 * The parent class.
 * @constructor
 * @struct
 */
name.space.Parent = function() {
  /** @protected {Property} The parent property. */
  this.parentProp = parentProp;
};

/**
 * The parent method.
 */
name.space.Parent.prototype.parentMethod = function() {
  this.parentProp; //: Property
  this.parentMethod; //: fn()
  this.childProperty; //: ?
  this.childMethod; //: ?
  this.grandchildProperty; //: ?
  this.grandchildMethod; //: ?
  this.siblingProperty; //: ?
  this.siblingMethod; //: ?
};

/**
 * The child class.
 * @extends {name.space.Parent}
 * @constructor
 * @struct
 */
name.space.Child = function() {
  /** @protected {Property} The child property. */
  this.childProperty = childProp;
};
goog.inherits(name.space.Child, name.space.Parent);

/** The child method. */
name.space.Child.prototype.childMethod = function() {
  this.parentProp; //: Property
  this.parentMethod; //: fn()
  this.childProperty; //: Property
  this.childMethod; //: fn()
  this.grandchildProperty; //: ?
  this.grandchildMethod; //: ?
  this.siblingProperty; //: ?
  this.siblingMethod; //: ?
};

/**
 * The grandchild class.
 * @extends {name.space.Child}
 * @constructor
 * @struct
 */
name.space.Grandchild = function() {
  /** @protected {Property} The grandchild property. */
  this.grandchildProperty = grandchildProp;
};
goog.inherits(name.space.Grandchild, name.space.Child);

/** The grandchild method. */
name.space.Grandchild.prototype.grandchildMethod = function() {
  this.parentProp; //: Property
  this.parentMethod; //: fn()
  this.childProperty; //: Property
  this.childMethod; //: fn()
  this.grandchildProperty; //: Property
  this.grandchildMethod; //: fn()
  this.siblingProperty; //: ?
  this.siblingMethod; //: ?
};

/**
 * The sibling class.
 * @extends {name.space.Parent}
 * @constructor
 * @struct
 */
name.space.Sibling = function() {
  /** @protected {Property} The sibling property. */
  this.siblingProperty = siblingProp;
};
goog.inherits(name.space.Sibling, name.space.Parent);

/** The sibling method. */
name.space.Sibling.prototype.siblingMethod = function() {
  this.parentProp; //: Property
  this.parentMethod; //: fn()
  this.childProperty; //: ?
  this.childMethod; //: ?
  this.grandchildProperty; //: ?
  this.grandchildMethod; //: ?
  this.siblingProperty; //: Property
  this.siblingMethod; //: fn()
};
