// Test the application of types and docs to functions.
// plugin=closure
// plugin=doc_comment null

/**
 * A test function.
 * @param {number} first The first argument.
 * @param {string} second The second argument.
 * @return {Class} The return value.
 */
var myFn = function(first, second) {
  first; //: number
  first; //doc: The first argument.
  second; //: string
  second; //doc: The second argument.
  return retVal;
}
myFn; //: fn(first: number, second: string) -> Class
myFn; //doc: A test function.
myFn(); //: Class
myFn(); //doc: The return value.

/**
 * This function just has docs.
 */
function secondFn() {
}
secondFn; //: fn()
secondFn; //doc: This function just has docs.

/**
 * This is a function, with no initialization.
 * @param {ParamType} param
 * @return {ReturnType}
 */
var noInitFn;
noInitFn; //: fn(param: ParamType) -> ReturnType

/**
 * We assume a commented, uninitialized value with no type info is a function
 * with no parameters and no return value.
 */
var nullFn;
nullFn; //: fn()

/**
 * A commented value initialized with the unknown return type of a function is
 * assumed to be a function.
 * @param {ParamType} param
 */
var constructedFn = unknownFn();
constructedFn; //: fn(param: ParamType)
