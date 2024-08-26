import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineCommand } from 'citty'

import { generate } from '../index'

export default defineCommand({
  meta: {
    name: 'generate',
    description: 'Generates a Factur-X/Order-X PDF-A/3 file from a PDF and a XML file',
  },
  args: {
    pdf: {
      type: "string",
      description: 'Input PDF file',
      required: true,
    },
    xml: {
      type: "string",
      description: 'Input XML file',
      required: true,
    },
    output: {
      type: "string",
      description: 'Output PDF-A/3 file, defaults to stdout',
      required: true,
      alias: 'o',
    },
    check: {
      type: "boolean",
      description: 'Validate the XML file',
      default: true,
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
    language: {
      type: "string",
      description: 'Language code for the PDF (RFC 3066)',
    },
  },
  run: async (args) => {
    const content = await generate({
      pdf: args.args.pdf,
      xml: args.args.xml,
      flavor: args.args.flavor,
      language: args.args.language,
      level: args.args.level,
      check: args.args.check,
    })

    const out = resolve(args.args.output)
    await writeFile(out, content)
    console.log(`Saved to ${out}`)
  }
})