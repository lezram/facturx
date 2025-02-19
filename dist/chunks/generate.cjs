'use strict';

const promises = require('node:fs/promises');
const node_path = require('node:path');
const citty = require('citty');
const index = require('../index.cjs');
require('node:buffer');
require('../shared/facturx.FKkurjps.cjs');
require('pdf-lib');
require('date-fns');
require('libxmljs2');

const generate = citty.defineCommand({
  meta: {
    name: "generate",
    description: "Generates a Factur-X/Order-X PDF-A/3 file from a PDF and a XML file"
  },
  args: {
    pdf: {
      type: "string",
      description: "Input PDF file",
      required: true
    },
    xml: {
      type: "string",
      description: "Input XML file",
      required: true
    },
    output: {
      type: "string",
      description: "Output PDF-A/3 file, defaults to stdout",
      required: true,
      alias: "o"
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
    language: {
      type: "string",
      description: "Language code for the PDF (RFC 3066)"
    }
  },
  run: async (args) => {
    const pdf = await promises.readFile(node_path.resolve(args.args.pdf));
    const xml = await promises.readFile(node_path.resolve(args.args.xml), "utf-8");
    const content = await index.generate({
      pdf,
      xml,
      flavor: args.args.flavor,
      language: args.args.language,
      level: args.args.level,
      check: args.args.check
    });
    const out = node_path.resolve(args.args.output);
    await promises.writeFile(out, content);
    console.log(`Saved to ${out}`);
  }
});

exports.default = generate;
