# Contributing to tern-closure

tern-closure welcomes bug fixes and patches.

Before making changes that interface with the core Tern library, it might be a
good idea to read the [Tern reference manual][tern-ref] and [blog
post][tern-blog], which together give a pretty good overview of how Tern works.
The core Tern code is quite dense, and not the kind of code you grok on first
read.

## Tests

tern-closure has two kinds of tests:

1. Test cases written for Tern's nifty [test framework][tern-tests]. Cases are
   in the `test/cases` directory, and consist of sample code to parse
   interspersed with comments which serve as assertions on inference results.

2. Regular old [Mocha][mocha] tests, using [Chai][chai] for assertions,
   [Sinon][sinon] for spies/stubs, and [sinon-chai][sinon-chai] for making them
   play together. These tests are in  `test/*_test.js` files.

The Tern framework test cases are very useful for testing interactions with
Tern's type inference system and server queries, while the Mocha tests are
better for other functionality (like file and visibility management).

To run the Tern framework tests directly, run:

```
node test/runcases.js [file_filter_string]
```

To run all the Mocha tests, run
```
mocha
```
or, if you don't have Mocha installed globally
```
./node_modules/.bin/mocha
```
Mocha provides many amenities (`-w`, `--growl`, etc).


`test/runcases_test.js` wraps the Tern framework tests in a Mocha test case, so
running all the Mocha tests also runs the Tern framework test cases.

You can also just run all the tests with
```
npm test
``` 

Pull requests with failing tests will not be accepted, and tests should be added
for new behavior.

## Style

tern-closure favors the more roomy style of the Closure library over the compact
style of the Tern core. We follow the [Google JavaScript style guide][jsstyle],
including JSDoc for methods.

You can lint your changes using and [gjslint][gjslint] (the Google Closure
linter) and [JSHint][jshint]:

```
gjslint --flagfile=.gjslintflags
jshint .
```

Simple `gjslint` errors can be automatically fixed using `fixjsstyle`:

```
fixjsstyle --flagfile=.gjslintflags
```

## Licensing

In all cases, contributors must sign a contributor license agreement with
Google, either for an individual or corporation, before a patch/pull request can
be accepted. Please fill out the agreement for an individual or a corporation,
as appropriate.

* https://developers.google.com/open-source/cla/individual

* https://developers.google.com/open-source/cla/corporate

[chai]: http://chaijs.com/
[gjslint]: https://developers.google.com/closure/utilities/
[jshint]: http://www.jshint.com/
[jsstyle]: http://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml
[mocha]: https://visionmedia.github.io/mocha/
[sinon-chai]: https://github.com/domenic/sinon-chai
[sinon]: http://sinonjs.org/
[tern-blog]: http://marijnhaverbeke.nl/blog/tern.html
[tern-ref]: http://ternjs.net/doc/manual.html
[tern-tests]: https://github.com/marijnh/tern/blob/master/test/runcases.js
