# tldr-lite [![build status](https://badgen.net/travis/vladimyr/tldr-lite/master)](https://travis-ci.com/vladimyr/tldr-lite) [![install size](https://badgen.net/packagephobia/install/tldr-lite)](https://packagephobia.now.sh/result?p=tldr-lite) [![npm package version](https://badgen.net/npm/v/tldr-lite)](https://npm.im/tldr-lite) [![github license](https://badgen.net/github/license/vladimyr/tldr-lite)](https://github.com/vladimyr/tldr-lite/blob/master/LICENSE) [![js semistandard style](https://badgen.net/badge/code%20style/semistandard/pink)](https://github.com/Flet/semistandard)

>lite command line `tldr` client; simplified and community-driven manpages

## Run
```
$ npx tldr-lite [command]
```

## Usage
```
$ npx tldr-lite --help

tldr-lite v0.2.0

Usage:
  $ tldr-lite <command>        # view tldr page for given command
  $ tldr-lite search <query>   # query tldr pages github repo
  $ tldr-lite home             # open tldr-pages github repo
  $ tldr-lite browse           # browse pages online
  $ tldr-lite < 7z.md          # render local page

Options:
  -r, --raw             Display raw version of tldr page (markdown)
  -w, --web             Open tldr page in web browser
  -f, --render <file>   Render tldr page from local file
  -h, --help            Show help
  -v, --version         Show version number

Homepage:     https://github.com/vladimyr/tldr-lite
Report issue: https://github.com/vladimyr/tldr-lite/issues
```
