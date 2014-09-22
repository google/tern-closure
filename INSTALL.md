#Installation

This document attempts to address the setup of [tern-closure](README.md) with
specific editors.

## Prerequisites

Basically any installation requires a recent version of Node and npm. For Linux
users, [nvm][nvm] is a good way to get both (apt repos often have hideously old
Node versions).

## Emacs

Follow [the Tern instructions for Emacs installation][emacs-install]. Wherever
you run `npm install` (step 2), also run `npm install tern-closure`.

## Vim

Follow the [tern_for_vim][tern_for_vim] installation instructions. When you run
`npm install` in `bundle/tern-for-vim`, also run `npm install tern-closure`.

## Sublime Text

If you are using Marijn Haverbeke's own [tern_for_sublime][tern_for_sublime],
then you can run `npm install tern-closure` in the `tern_for_sublime` directory,
where you ran `npm install`.

If you know how to install tern-closure with the alternative
[sublime-tern][sublime-tern-alt], let me know!

## Gedit

If you are using [tern_for_gedit][tern_for_gedit], you need to install
tern-closure globally (in addition to installing Tern globally as per the
tern_for_gedit README): `npm install -g tern-closure`

[emacs-install]: http://ternjs.net/doc/manual.html#emacs
[nvm]: https://github.com/creationix/nvm
[sublime-tern-alt]: https://github.com/emmetio/sublime-tern
[tern_for_gedit]: https://github.com/Swatinem/tern_for_gedit
[tern_for_sublime]: https://github.com/marijnh/tern_for_sublime
[tern_for_vim]: https://github.com/marijnh/tern_for_vim
