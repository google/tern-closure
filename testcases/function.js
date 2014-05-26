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
secondFn; //doc: This function just has docs.
