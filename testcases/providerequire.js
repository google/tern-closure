// Test custom goog.provide and goog.require handling.
// plugin=closure
// plugin=doc_comment null

goog.provide('name.space.Class');
name; //: name
name.space; //: name.space
name.space.Class; //: name.space.Class

goog.require('we.need.ThisClass');
we; //: we
we.need; //: we.need
we.need.ThisClass //: we.need.ThisClass
