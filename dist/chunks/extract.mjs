import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineCommand } from 'citty';
import { extract as extract$1 } from '../index.mjs';
import 'node:buffer';
import '../shared/facturx.BF81-SG6.mjs';
import 'pdf-lib';
import 'date-fns';
import 'libxmljs';

const extract = defineCommand({
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
    const pdf = await readFile(resolve(args.args.pdf));
    const [file, content] = await extract$1({
      pdf,
      flavor: args.args.flavor,
      level: args.args.level,
      check: args.args.check
    });
    if (args.args.output) {
      const out = resolve(args.args.output);
      await writeFile(out, content);
      console.log(`Saved to ${out}`);
    } else {
      console.log(content);
    }
  }
});

export { extract as default };
