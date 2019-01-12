'use strict';

const debug = require('debug')('parser');
const kleur = require('kleur');
const marked = require('marked');
const Page = require('./page');
const terminalLink = require('terminal-link');
const unescape = require('unescape');

const castArray = arg => Array.isArray(arg) ? arg : [arg];
const humanize = url => url.replace(/^https?:\/\//, '');
const isFunction = arg => typeof arg === 'function';
const last = arr => arr[arr.length - 1];

const State = {
  Title: Symbol('title'),
  Description: Symbol('description'),
  ExampleDescription: Symbol('example:description'),
  ExampleCode: Symbol('example:code')
};

class Parser extends marked.TextRenderer {
  constructor() {
    super();
    this._state = null;
  }

  get state() {
    return this._state;
  }

  _setState({ from, to } = {}) {
    if (!from) {
      debug('state: to=%s', to);
      this._state = to;
      return;
    }
    from = castArray(from);
    if (!from.includes(this.state)) return;
    debug('state: from=%s to=%s', this.state, to);
    this._state = to;
  }

  parse(contents, options) {
    this.page = new Page();
    const renderer = new Proxy(this, {
      get(target, name) {
        return function (text, ...args) {
          if (!isFunction(target[name])) return;
          return target[name](unescape(text), ...args);
        };
      }
    });
    marked(contents, { renderer, ...options, sanitize: true });
    debug('page name: %s', this.page.name);
    debug('page description: %s', this.page.description);
    return this.page;
  }

  heading(text, level) {
    if (level !== 1) return text;
    this._setState({ to: State.Title });
    this.page.name = text.trim();
    return text;
  }

  blockquote(text) {
    this._setState({
      from: State.Title,
      to: State.Description
    });
    if (this.state === State.Description) {
      this.page.description += text;
    }
    return text;
  }

  listitem(text) {
    this._setState({
      from: [State.Description, State.ExampleCode],
      to: State.ExampleDescription
    });
    if (this.state === State.ExampleDescription) {
      this.page.examples.push({ description: text });
    }
    return text;
  }

  codespan(text) {
    this._setState({
      from: State.ExampleDescription,
      to: State.ExampleCode
    });
    if (this.state === State.ExampleCode) {
      const example = last(this.page.examples);
      if (example && !example.code) example.code = text;
      return text;
    }
    if (text === this.page.name) return text;
    return kleur.bold().underline(text);
  }

  paragraph(text) {
    return text;
  }

  strong(text) {
    return kleur.bold(text);
  }

  em(text) {
    return kleur.italic(text);
  }

  link(url) {
    url = normalize(url);
    const label = kleur.bold(humanize(url));
    return terminalLink(label, url, { fallback: (_, url) => `<${url}>` });
  }

  static parse(contents, options) {
    return new this().parse(contents, options);
  }
}

module.exports = Parser;

function normalize(url) {
  return url
    .replace(/^(https?:\/\/)www\./, '$1')
    .replace(/(?:\.html)?\/?$/, '');
}
