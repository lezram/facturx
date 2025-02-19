import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineCommand } from 'citty';
import { check as check$1 } from '../index.mjs';
import 'node:buffer';
import '../shared/facturx.Dn5cg3YR.mjs';
import 'pdf-lib';
import 'date-fns';
import 'libxmljs2';

const check = defineCommand({
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
    const xml = await readFile(resolve(args.args.xml), "utf8");
    const options = {
      xml,
      flavor: args.args.flavor,
      level: args.args.level
    };
    const valid = await check$1(options);
    if (!valid) {
      console.error(`Invalid XML format (${options.flavor} - ${options.level})`);
      process.exit(1);
    }
    console.log(`Valid XML format (${options.flavor} - ${options.level})`);
  }
});

export { check as default };
