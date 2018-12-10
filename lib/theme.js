'use strict';

const debug = require('debug')('theme');
const kleur = require('kleur');
const os = require('os');
const path = require('path');
const readFile = require('util').promisify(require('fs').readFile);
const themes = require('../themes.json');

const identity = arg => arg;

module.exports = class Theme {
  constructor(options = themes.simple) {
    this.styles = options;
    this._formatters = {};
  }

  _getFormatter(type) {
    debug('get formatter for: "%s"', type);
    return createFormatter(this.styles[type]);
  }

  renderCommandName(text) {
    return this._getFormatter('commandName')(text);
  }

  renderMainDescription(text) {
    return this._getFormatter('mainDescription')(text);
  }

  renderExampleDescription(text) {
    return this._getFormatter('exampleDescription')(text);
  }

  renderExampleCode(text) {
    return this._getFormatter('exampleCode')(text);
  }

  renderExampleToken(text) {
    return this._getFormatter('exampleToken')(text);
  }

  static async getSelected() {
    const config = await readConfig();
    debug('config:theme', config.theme);
    if (!config.theme) return new Theme();
    const theme = (config.themes && config.themes[config.theme]) ||
                  themes[config.theme];
    return new Theme(theme);
  }
};

function createFormatter(styles) {
  styles = styles || '';
  debug('styles:', styles);
  styles = styles.trim();
  if (!styles) return identity;
  const modifiers = styles.split(/\s*,\s*/g).filter(name => Boolean(kleur[name]));
  if (modifiers.length <= 0) return identity;
  debug('modifiers:', modifiers);
  return function (text) {
    const last = modifiers.pop();
    const chain = modifiers.reduce((chain, name) => chain[name](), kleur);
    return chain[last](text);
  };
}

async function readConfig(filename = '.tldrrc') {
  try {
    const contents = await readFile(path.join(os.homedir(), filename));
    return JSON.parse(contents);
  } catch (err) {
    return {};
  }
}
