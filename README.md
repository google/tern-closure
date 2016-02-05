# tern-closure

[![Build Status](https://secure.travis-ci.org/google/tern-closure.png)](http://travis-ci.org/google/tern-closure)
[![NPM version](https://img.shields.io/npm/v/tern-closure.svg)](https://www.npmjs.org/package/tern-closure)

[tern-closure][tern-closure] is a plugin which adds support for [Closure
Compiler annotations][compiler] and the Closure type system to the JavaSript
code intelligence system [Tern][tern].

To use tern-closure, you need to [install](#installation) it and then
[configure](#configuration) Tern to load it.

## Features

tern-closure adds the following features to your Tern installation:

1. Understanding of types in JSDoc type annotations (similar to the
   [doc_comment plugin][doc_comment] included with Tern).
2. Understanding of inheritance and interfaces with `@extends` and
   `@implements`.
3. Completion and go-to-definition support for type names in JSDoc comments and
   in strings (e.g. `@type` annotations and `goog.require` arguments).
4. Automatic loading of the definitions for types, so that you get completion
   and type information from other files and can jump to definitions in those
   files. This requires enabling a [finder](#finders). We consider access
   modifiers and how types are used in order to load only the types relevant
   the files you are editing, keeping this feature feasible even for large
   projects.


## <a name="installation"></a> Installation

Currently, tern-closure only works with the NodeJS [Tern Server][tern-server],
and not within a browser.

### Short version

After installing Tern according the setup instructions of your desired [editor
plugin][tern-editor], go to the place where the [Tern package][tern-npm] was
installed (or the [Tern repo][tern-repo] was cloned) and run

```
$ npm install tern-closure
```
Or, if you're not sure where Tern was installed, you can try
```
$ npm install -g tern-closure
```

### Long version

See [INSTALL.md](INSTALL.md) for instructions tailored to each editor.

## <a name="configuration"></a> Configuration

In order for Tern to load the tern-closure plugin once it is installed, you must
include `closure` in the `plugins` section of your [Tern configuration
file][tern-config]. The configuration file can be either a file named
`.tern-project` in your project's root directory, or `.tern-config` in your home
directory.

You must also explicitly disable the default `doc_comment` plugin, which will
interfere with tern-closure.

Here is a minimal example `.tern-project` configuration file:

```json
{
  "plugins": {
    "doc_comment": false,
    "closure": {}
  }
}
```

<a name="project-dir"></a>
#### "Project directory" and `.tern-project` vs `.tern-config`

Tern looks for `.tern-project` first, walking up the directory tree, and uses
its location as the "project directory". If no `.tern-project` is found, your
`.tern-config` is loaded instead, and *the working directory of the Tern server
process is used as the "project directory"*.

Since Tern and tern-closure (including finders like [grep](#grep)) use the
"project directory" as the base for all relative paths, you should either use
`.tern-project` or be careful about where you start your Tern server (or, where
your editor plugin starts your Tern server).

### Options

You can set the following options in the `closure` section of your Tern
configuration file:

 * `finder` *Object*. Configuration for finding the files that provide types.
   See [Finders](#finders) below. *Optional. Default: None.*
 * `debug` *boolean*. Whether tern-closure should print debug output. *Optional.
   Default: Match Tern `debug` option.*
 * `noMinimalLoad` *boolean*. When a finder is active, this disables attempts to
   limit loaded files according to visibility. This is mostly for debugging - if
   setting this fixes an issue, file a bug. *Optional. Default: `false`*.

### <a name="finders"></a> Finders 

tern-closure uses "finders" to find the files providing Closure names via
`goog.provide`. Finders allow tern-closure to load and interpret the files
providing names required via `goog.require` or referenced in JSDoc type strings
so it better understands the context of a given file.

The `finder` section of the options object for `closure` in your `.tern-project`
file specifies what finder implementation you want to use, and what options you
want to pass to the finder. By default, no finder is used, and files are not
automatically loaded. Currently, only one finder implementation is included with
tern-closure, [grep](#grep).

*Common finder options:*

 * `name` The name of the finder you want to use. *Required.*
 * `debug` Whether the finder should print debug output. *Optional. Default:
   Match tern-closure `debug` option.*

#### <a name="grep"></a> grep

This is a basic finder which uses the `grep` command-line utility (or `findstr`
in Windows) to search for `goog.provide` statements at startup and create a map
of Closure names to providing files.

*Options:*

 * `dirs` An array of path strings indicating which directories to search for
   files. Paths can either be absolute, or relative to the [project
   directory](#project-dir).  *Optional. Default: `['.']` (just the project
   directory).*

Here is an example `.tern-project` file using the grep finder:

```json
{
  "plugins": {
    "doc_comment": false,
    "closure": {
      "finder": {
        "name": "grep",
        "dirs": [
          "relevant/project/subdir",
          "/absolute/path/to/library"
        ]
      }
    }
  }
}
```

#### Additional finders

You can easily use a finder not included in this repository, or implement your
own. This allows you to search for names in different ways, on demand, and to
use existing indexes of your codebase.

Given a finder name `name`, tern-closure first looks in its own `lib/finder`
directory, then attempts to load `name` using `require()`, so a third-party
finder module can be installed as an npm package.

A finder module must implement a simple interface:

 * It must export a constructor `function(projectDir: string, options: Object)`
   which takes the project directory and an options object as parameters.
   Options are specified in the Tern configuration file.
 
 * Instances of that constructor must have a method `findFile(name: string, cb:
   function(file: string))`, which takes as arguments a Closure name `name` to
   find and a callback function `cb` to call with the path to file providing
   `name`. `cb` should be called asynchronously, even if the providing file is
   known when `findFile` is called. This allows finders to execute I/O
   operations to find files on demand.

Please note that while tern-closure is in a `0.X.X` release, the finder API may
be subject to breaking changes.

## Bug reports and feature requests

Please file bug reports and feature requests as issues on the [issues
page][tern-closure-issues] of the tern-closure repository.

## Contributing

Pull requests to tern-closure are welcome. Please see the
[CONTRIBUTING.md](CONTRIBUTING.md) file for requirements and guidelines.

Disclaimer: tern-closure is not an official Google product, and is maintained on
a best-effort basis.

[compiler]: https://developers.google.com/closure/compiler/docs/js-for-compiler
[doc_comment]: http://ternjs.net/doc/manual.html#plugin_doc_comment
[npm]: https://www.npmjs.org/
[tern-closure-issues]: https://github.com/google/tern-closure/issues
[tern-closure]: https://github.com/google/tern-closure
[tern-config]: http://ternjs.net/doc/manual.html#configuration
[tern-editor]: http://ternjs.net/doc/manual.html#editor
[tern-npm]: https://www.npmjs.org/package/tern
[tern-repo]: https://github.com/marijnh/tern
[tern-server]: http://ternjs.net/doc/manual.html#server
[tern]: http://ternjs.net
