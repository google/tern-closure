var filter = process.argv[2];
var c = require("tern/test/condense-utils");
var util = require("tern/test/util");
var path = require("path");

var closure = require('../closure');
//Locate the Tern distribution installed with this repo and initialize the
//tern-closure plugin.
var ternDir = path.resolve(require.resolve('tern/lib/tern'), '../..');
closure.initialize(ternDir);

var closureCondenseConf = Object.create(c.condenseConf);
closureCondenseConf.projectDir = path.resolve(__dirname, "..");

exports.runTests = function(filter) {
  function test(options) { c.testConf(closureCondenseConf, filter, options) };

  test({load: ["union-types"], plugins: {closure: true}});

}