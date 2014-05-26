#!/usr/bin/env node
path = require('path');
runcases = require('tern/test/runcases');
require('closure');

var filter = process.argv[2];
var caseDir = path.resolve(__dirname, 'testcases');
runcases.runTests(filter, caseDir);
