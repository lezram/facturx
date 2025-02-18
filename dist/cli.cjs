'use strict';

const citty = require('citty');
const _package = require('./shared/facturx.NRNugK8B.cjs');

const main = citty.defineCommand({
  meta: {
    name: _package.name,
    description: _package.description,
    version: _package.version
  },
  subCommands: {
    extract: () => import('./chunks/extract.cjs').then((r) => r.default),
    generate: () => import('./chunks/generate.cjs').then((r) => r.default),
    check: () => import('./chunks/check.cjs').then((r) => r.default)
  }
});
const runMain = () => citty.runMain(main);

exports.main = main;
exports.runMain = runMain;
