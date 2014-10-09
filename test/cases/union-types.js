// Union Types
// plugin=closure
// plugin=doc_comment null

/** @type {(number|string)} */
var union;
union; //: (number|string)


// observe that some completions are coming from the type number such as
// Number.prototype.toExponential and others, such as charAt are coming
// from String.prototype
union. //+ toString, toFixed, toExponential, charAt, charCodeAt, indexOf, ...