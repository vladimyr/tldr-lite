'use strict';

const { basename, dirname, extname } = require('path');
const debug = require('debug')('search');
const pkg = require('../package.json');
const r = require('gh-got');

const castArray = arg => Array.isArray(arg) ? arg : [arg];
const getPageName = ({ name }) => basename(name, extname(name));
const getOS = ({ path }) => dirname(path).split('/').slice(-1);
const quote = str => `"${str}"`;

const getContext = () => ({
  repo: pkg.config.tldrRepo,
  path: pkg.config.tldrPageDir,
  language: 'markdown'
});

module.exports = {
  remotePaths,
  search
};

async function remotePaths(command) {
  debug('command: %s', command);
  const query = formatQuery(quote(command), { ...getContext(), in: 'path' });
  debug('query: %s', decodeURIComponent(query));
  const resp = await r.get(`search/code`, { query });
  const pages = resp.body.items
    .filter(it => getPageName(it) === command)
    .map(it => ({ os: getOS(it), path: it.path }));
  debug('%i pages found', pages.length);
  return pages.reduce((acc, it, i) => {
    debug('%i) %s [os=%s]', i + 1, it.path, it.os);
    acc[it.os] = it.path;
    acc.push(it.path);
    return acc;
  }, []);
}

async function search(input, limit = 10, threshold = 0) {
  const query = formatQuery(input, getContext());
  debug('query: %s', decodeURIComponent(query));
  const resp = await r.get(`search/code`, { query });
  const total = resp.body.items.length;
  debug('query returned %i results', total);
  let pages = resp.body.items.filter(it => it.score > threshold);
  debug('%i/%i results are above threshold [score > %i]',
    pages.length, total, threshold);
  pages = pages.map(it => ({
    name: getPageName(it),
    os: castArray(getOS(it)),
    filename: castArray(it.name),
    filepath: castArray(it.path),
    score: it.score
  }));
  pages = deduplicate(pages).slice(0, limit);
  debug('returning %i pages [limit=%i, total=%i]', pages.length, limit, total);
  pages.map(({ name, ...data }) => debug('%s: %j', name, data));
  return pages;
}

function deduplicate(pages) {
  return pages.reduce((acc, page) => {
    if (!acc.hasOwnProperty(page.name)) {
      acc.push(page);
      acc[page.name] = page;
      return acc;
    }
    const existing = acc[page.name];
    existing.os.push(...page.os);
    existing.filename.push(...page.filename);
    existing.filepath.push(...page.filepath);
    existing.score = Math.min(existing.score, page.score);
    return acc;
  }, []);
}

function formatQuery(input, context, joiner = '+') {
  let query = input.split(/\s+/g).map(it => encodeURIComponent(it)).join(joiner);
  query = Object.keys(context).reduce((acc, key) => {
    const values = castArray(context[key]);
    const params = values.map(value => encodeURIComponent(`${key}:${value}`));
    return acc + joiner + params.join(joiner);
  }, query);
  return `q=${query}`;
}
