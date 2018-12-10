'use strict';

const debug = require('debug')('parser');
const kleur = require('kleur');
const marked = require('marked');
const Page = require('./page');
const unescape = require('unescape');

const last = arr => arr[arr.length - 1];

class Parser {
  parse(contents, options) {
    this._prev = null;
    this.page = new Page();
    const renderer = new Proxy(this, {
      get(target, name) {
        if (!target[name]) return () => (this._prev = name);
        return function (text, ...args) {
          const result = target[name](unescape(text), ...args);
          this._prev = name;
          return result;
        };
      }
    });
    marked(contents, { renderer, ...options, sanitize: true });
    debug('page name: %s', this.page.name);
    debug('page description: %s', this.page.description);
    return this.page;
  }

  heading(text, level) {
    if (level !== 1) return;
    this.page.name = text.trim();
    return text;
  }

  blockquote(text) {
    this.page.description += text;
    return text;
  }

  listitem(text) {
    this.page.examples.push({ description: text });
    return text;
  }

  codespan(text) {
    if (text !== this.page.name && this._prev !== 'listitem') {
      return kleur.bold().underline(text);
    }
    const example = last(this.page.examples);
    if (example && !example.code) example.code = text;
    return text;
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

  text(text) {
    return text;
  }

  static parse(contents, options) {
    return new this().parse(contents, options);
  }
}

module.exports = Parser;
