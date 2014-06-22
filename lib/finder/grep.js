'use strict';
var spawn = require('child_process').spawn;
var path = require('path');
var carrier = require('carrier');


/**
 * A regular expression for parsing goog.provide results from grep output.
 * @type {RegExp}
 */
var PROVIDE_RE = /^(.+\.js):goog\.provide\(['"](\S+)['"]\);/;


/**
 * A simple class for mapping class names to origin files which pre-populates a
 * map of names to files by delegating to grep.
 * @constructor
 */
var GrepFileFinder = function(projectDir, options) {
  /**
   * A map of class names to canonical file paths.
   * @type {Object.<string>}
   * @private
   */ 
  this.files_ = {};
  
  this.prepopulate_(projectDir, options);
}
module.exports = GrepFileFinder;


/**
 * Pre-populates the internal file map.
 * @private
 */
GrepFileFinder.prototype.prepopulate_ = function(projectDir, options) {
  // TODO: Track when done prepopulating, defer calls that come in before done.
  var search = spawn('grep', ['-R', '--include=*.js', '^goog.provide(']);
  search.stdout.setEncoding('utf8');
  carrier.carry(search.stdout, (function(line) {
    var match = line.match(PROVIDE_RE);
    this.files_[match[2]] = match[1];
  }).bind(this));
};


/**
 * @param {string} name
 * @param {fn(string)} cb
 */
GrepFileFinder.prototype.findFile = function(name, cb) {
  setTimeout((function() {
    cb(this.files_[name]);
  }).bind(this));
};
