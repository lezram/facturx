import { defineCommand } from 'citty'

import { check } from '../index'

export default defineCommand({
  meta: {
    name: 'check',
    description: 'Checks if a XML file is a valid Factur-X/Order-X file',
  },
  args: {
    xml: {
      type: "positional",
      description: 'Input XML file',
      required: true,
    },
    flavor: {
      type: "string",
      description: 'Schema flavor, autodetect by default (facturx, orderx, zugferd)',
      alias: 'f',
    },
    level: {
      type: "string",
      description: 'Schema level, autodetect by default (orderx: basic, extended, comfort) (facturx: basic, basic-wl, en16931, extended, minimum)',
      alias: 'l',
    },
  },
  run: async (args) => {
    const options = {
      xml: args.args.xml,
      flavor: args.args.flavor,
      level: args.args.level,
    }
    const valid = await check(options)

    console.table({ ...options, valid })
  }
})