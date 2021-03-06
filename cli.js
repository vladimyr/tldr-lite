'use strict';

const kleur = require('kleur');
kleur.enabled = Boolean(process.stdout.isTTY);

const { remotePaths, search } = require('./lib/search');
const getStdin = require('get-stdin');
const open = require('open');
const Parser = require('./lib/parser');
const path = require('path');
const pkg = require('./package.json');
const r = require('gh-got');
const { readFile } = require('fs');
const { URL } = require('url');
const Theme = require('./lib/theme');

const platform = (name => {
  if (name === 'darwin') return 'osx';
  if (name === 'win32') return 'windows';
  return name;
})(process.platform);
// NOTE: Copied from bili (by @egoist): https://git.io/fxupU
const supportsEmoji = process.platform !== 'win32' ||
                      process.env.TERM === 'xterm-256color';

const emoji = char => supportsEmoji ? `${char}  ` : '';
const formatError = msg => msg.replace(/^\w*Error:\s+/, match => kleur.red().bold(match));

const options = require('minimist-options')({
  help: { type: 'boolean', alias: 'h' },
  version: { type: 'boolean', alias: 'v' },
  raw: { type: 'boolean', alias: 'r' },
  web: { type: 'boolean', alias: 'w' },
  render: { type: 'string', alias: 'f' }
});
const argv = require('minimist')(process.argv.slice(2), options);

const help = `
  ${kleur.bold(pkg.name)} v${pkg.version}

  Usage:
    $ ${pkg.name} <command>        # view tldr page for given command
    $ ${pkg.name} search <query>   # query tldr pages github repo
    $ ${pkg.name} home             # open tldr-pages github repo
    $ ${pkg.name} browse           # browse pages online
    $ ${pkg.name} < 7z.md          # render local page

  Options:
    -r, --raw             Display raw version of tldr page (markdown)
    -w, --web             Open tldr page in web browser
    -f, --render <file>   Render tldr page from local file
    -h, --help            Show help
    -v, --version         Show version number

  Homepage:     ${kleur.green(pkg.homepage)}
  Report issue: ${kleur.green(pkg.bugs.url)}
`;

program(argv._, argv).catch(err => console.error(formatError(err.stack)));

async function program(args, flags) {
  const [command, ...tokens] = args;
  if (flags.version) return console.log(pkg.version);
  if (flags.help) return console.log(help);
  const contents = await getStdin();
  if (contents) return displayPage(contents, flags.raw);
  if (flags.render) {
    const contents = await readFile(flags.render, 'utf-8');
    return displayPage(contents, flags.raw);
  }
  if (!command) {
    return console.error(formatError('Error: Page name or command required!'));
  }
  if (command === 'home') return openUrl(pkg.config.tldrRepoUrl);
  if (command === 'browse') {
    return openUrl(pkg.config.tldrRepoUrl, '/tree/master/pages');
  }
  if (command === 'search') return searchPages(normalize(tokens));
  viewPage(args, { raw: flags.raw, useBrowser: flags.web });
}

async function viewPage(args, { raw, useBrowser } = {}) {
  const command = args.join(' ').replace(/\s+/g, '-');
  const paths = await remotePaths(command);
  const pagePath = paths[platform] || paths[0];
  if (!pagePath) {
    console.error('Page not found.');
    return console.error('\n%sFeel free to send pull request to: %s',
      emoji('💡'), pkg.config.tldrRepoUrl);
  }
  if (useBrowser) {
    return openUrl(pkg.config.tldrRepoUrl, '/blob/master/', pagePath);
  }
  const resp = await fetch(pkg.config.tldrRepoUrl, '/raw/master/', pagePath);
  if (raw) return console.log(resp.body);
  displayPage(resp.body, raw);
}

async function searchPages(query) {
  if (!query) {
    console.error(formatError('Error: No search query provided!'));
    return console.log(help);
  }
  console.log('%sSearching for: %s', emoji('🔍'), kleur.yellow(query));
  const pages = await search(query);
  if (!pages.length) {
    return console.log('%sNo pages found. Try different search.', emoji('⛔️'));
  }
  console.log();
  pages.map(page => console.log('  $ %s', pageInfo(page)));
  return console.log('\n%sRun %s to see specific page.',
    emoji('💡'), kleur.yellow(`npx ${pkg.name} <command>`));
}

async function displayPage(contents, raw = false) {
  if (raw) return console.log(contents);
  const page = Parser.parse(contents);
  const theme = await Theme.getSelected();
  console.log(page.toString(theme));
}

function openUrl(baseUrl, ...pathname) {
  const url = new URL(baseUrl);
  url.pathname = path.join(url.pathname, ...pathname);
  return open(url.href, { wait: false });
}

function pageInfo(page) {
  if (page.os[0] === 'common') return kleur.bold(page.name);
  return `${kleur.bold(page.name)}  (Available on: ${page.os.sort().join(', ')})`;
}

function normalize(query) {
  return query.join(' ').replace(/\s+/g, ' ')
    .replace(/\s+or\s+/ig, op => op.toUpperCase())
    .replace(/\s+and\s+/ig, op => op.toUpperCase());
}

function fetch(baseUrl, ...pathname) {
  const url = new URL(baseUrl);
  url.pathname = path.join(url.pathname, ...pathname);
  return r.get(url.href, { json: false, baseUrl: null, headers: null });
}
