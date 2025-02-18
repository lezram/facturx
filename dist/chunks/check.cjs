'use strict';

const promises = require('node:fs/promises');
const node_path = require('node:path');
const citty = require('citty');
const index = require('../index.cjs');
require('node:buffer');
require('../shared/facturx.NRNugK8B.cjs');
require('pdf-lib');
require('date-fns');
require('libxmljs2');

const check = citty.defineCommand({
  meta: {
    name: "check",
    description: "Checks if a XML file is a valid Factur-X/Order-X file"
  },
  args: {
    xml: {
      type: "positional",
      description: "Input XML file",
      required: true
    },
    flavor: {
      type: "string",
      description: "Schema flavor, autodetect by default (facturx, orderx, zugferd)",
      alias: "f"
    },
    level: {
      type: "string",
      description: "Schema level, autodetect by default (orderx: basic, extended, comfort) (facturx: basic, basic-wl, en16931, extended, minimum)",
      alias: "l"
    }
  },
  run: async (args) => {
    const xml = await promises.readFile(node_path.resolve(args.args.xml), "utf8");
    const options = {
      xml,
      flavor: args.args.flavor,
      level: args.args.level
    };
    const valid = await index.check(options);
    if (!valid) {
      console.error(`Invalid XML format (${options.flavor} - ${options.level})`);
      process.exit(1);
    }
    console.log(`Valid XML format (${options.flavor} - ${options.level})`);
  }
});

exports.default = check;
