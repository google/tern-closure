// Tests for type expressions that are not yet fully supported. Basicallly, this
// is a TODO list, but these tests also verify that unsupported type expressions
// don't cause outright failures.
// plugin=closure
// plugin=doc_comment null

/** @type {?MyClass} */
var nullable;
nullable;//: MyClass

/** @type {!MyClass} */
var nonNullable;
nonNullable;//: MyClass

/** @type {(MyClass|YourClass)} */
var union;
union;//: YourClass

/** @type {(!MyClass|!YourClass|{prop:(Blah|Blam)})} */
var nested;
nested; //: YourClass

/**
 * @param {ParamType=} opt_param
 */
var fnOptParam = function(opt_param) {
  opt_param; //: ParamType
};
fnOptParam; //: fn(opt_param: ParamType)

/**
 * @param {...ParamType} var_args
 */
var fnVarArgs = function(var_args) {
  var_args; //: ParamType
};
fnVarArgs; //: fn(var_args: ParamType)

/** @type {function(ParamType): ReturnType} */
var fnTypeExpr;
fnTypeExpr; //: ?

// Tests support for a literal void return type.
/** @type {function(ParamType): void} */
var voidFnTypeExpr;
voidFnTypeExpr; //: ?

/** @type {{prop1: Prop1Type, prop2: Prop2Type}} */
var recordTypeExpr;
recordTypeExpr; //: ?
