// Test the simple application of types and docs to values.
// plugin=closure
// plugin=doc_comment null

/** @type {number} */
var a;
a; //: number

/** @type {boolean} */
var b;
b; //: bool

/** @type {string} */
var c;
c; //: string

/** @type {Array} */
var d;
d; //: [?]

/** @type {Object} */
var e;
e; //: {}

// Tests applying a not-yet-defined class.
/** @type {MyClass} */
var f;
f; //: MyClass
// Tests that a stand-in function type has been created.
MyClass; //: fn()

// Tests applying a namespaced class.
/** @type {name.spaced.Class} */
var g;
g; //: name.spaced.Class
name; //: name
name.spaced; //: name.spaced
name.spaced.Class; //: fn()

/**
 * Docs for this var.
 * @type {Blah}
 */
var h;
h; //doc: Docs for this var.

/** @type {Blah} Some docs. */
var i;
i; //doc: Some docs.
