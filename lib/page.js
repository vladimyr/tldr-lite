'use strict';

const LF = '\n';

const indent = (padding, str) => padding + str.replace(/\r?\n/g, LF + padding);
const isEven = num => num % 2 === 0;
const reToken = /\{\{(.*?)\}\}/g;

class Lines {
  constructor(str = '') {
    this._buf = str;
  }

  add(...args) {
    this._buf += args.join('') + LF;
  }

  toString() {
    return this._buf;
  }
}

module.exports = class Page {
  constructor() {
    this.name = '';
    this.description = '';
    this.examples = [];
  }

  toString(theme) {
    const lines = new Lines();
    const padding = '  ';

    lines.add(LF, indent(padding, theme.renderCommandName(this.name)), LF);
    lines.add(indent(padding, theme.renderMainDescription(this.description)), LF);

    this.examples.forEach(({ description, code }) => {
      lines.add(indent(padding, theme.renderExampleDescription(`- ${description}`)));
      lines.add(indent(padding + '  ', highlight(code, theme)), LF);
    });

    return lines.toString();
  }
};

function highlight(code, theme) {
  const parts = code.split(reToken);
  return parts.map((it, index) => {
    if (isEven(index + 1)) return theme.renderExampleToken(it);
    return theme.renderExampleCode(it);
  }).join('');
}
