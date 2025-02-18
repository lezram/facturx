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

const extract = citty.defineCommand({
  meta: {
    name: "extract",
    description: "Extracts Factur-X/Order-X XML file from a PDF-A/3 file"
  },
  args: {
    pdf: {
      type: "positional",
      description: "Input PDF-A/3 file",
      required: true
    },
    check: {
      type: "boolean",
      description: "Validate the XML file",
      default: true
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
    },
    output: {
      type: "string",
      description: "Output XML file, defaults to stdout",
      alias: "o"
    }
  },
  run: async (args) => {
    const pdf = await promises.readFile(node_path.resolve(args.args.pdf));
    const [file, content] = await index.extract({
      pdf,
      flavor: args.args.flavor,
      level: args.args.level,
      check: args.args.check
    });
    if (args.args.output) {
      const out = node_path.resolve(args.args.output);
      await promises.writeFile(out, content);
      console.log(`Saved to ${out}`);
    } else {
      console.log(content);
    }
  }
});

exports.default = extract;
