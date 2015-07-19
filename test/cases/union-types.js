// Union Types
// plugin=closure
// plugin=doc_comment null

/** @type {(number|string)} */
var union;
union; //: (number|string)


// Observe that some completions are coming from the number type such as
// Number.prototype.toExponential and others, such as charAt are coming
// from String.prototype.
union. //+ toString, toFixed, toExponential, charAt, charCodeAt, indexOf, ...