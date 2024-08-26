import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Buffer } from 'node:buffer'
import pkg from '../package.json' assert { type: 'json' }

import { parseXmlAsync, XMLDocument } from 'libxmljs'
import {
  PDFDocument,
  AFRelationship,
} from 'pdf-lib';

import { extractAttachments } from './utils/pdf'
import { getXsd, getLevel, getFlavor, extractBaseInfo, baseInfo2PdfMetadata } from './utils/schema'
import { FACTURX_FILENAME, ORDERX_FILENAME, PdfMetadata, ZUGFERD_FILENAMES } from './constants'
import { resolvePdf, resolveXml } from './utils/resolve'

export async function generate(options: {
  pdf: string | Buffer | PDFDocument
  xml: string | Buffer | XMLDocument
  check?: boolean
  flavor?: string
  level?: string
  language?: string
  meta?: PdfMetadata
}) {
  const xmlDoc =  await resolveXml(options.xml)

  options.flavor ||= getFlavor(xmlDoc)
  options.level ||= getLevel(xmlDoc)

  if (options.check === true && !await check({
    xml: xmlDoc,
    flavor: options.flavor,
    level: options.level,
  })) {
    throw new Error(`Invalid XML format (${options.flavor} - ${options.level})`)
  }

  let meta = options.meta

  if (!meta) {
    const info = await extractBaseInfo(xmlDoc)
    meta = baseInfo2PdfMetadata(info)
  }

  let description = ''
  let filename = ''

  switch (options.flavor) {
    case 'facturx':
      filename = FACTURX_FILENAME
      description = 'Factur-X XML file'
      break
    case 'orderx':
      filename = ORDERX_FILENAME
      description = 'Order-X XML file'
      break
    case 'zugferd':
      filename = ZUGFERD_FILENAMES[0]
      description = 'ZUGFeRD XML file'
      break
    default:
      throw new Error(`Unknown schema flavor: "${options.flavor}"`)
  }

  const now = new Date()
  const pdfDoc = await resolvePdf(options.pdf)
  
  await pdfDoc.attach(xmlDoc.toString(), filename, {
    afRelationship: AFRelationship.Data,
    mimeType: 'application/xml',
    creationDate: now,
    modificationDate: now,
    description,
  })

  if (options.language) {
    pdfDoc.setLanguage(options.language)
  }
  pdfDoc.setCreationDate(now)
  pdfDoc.setModificationDate(now)

  pdfDoc.setTitle(meta.title)
  pdfDoc.setSubject(meta.subject)
  pdfDoc.setAuthor(meta.author)
  pdfDoc.setKeywords(meta.keywords)
  pdfDoc.setCreator(`${pkg.name} npm lib v${pkg.version} (https://github.com/${pkg.repository})`)

  return await pdfDoc.save()
}

export async function extract(options: {
  pdf: string | Buffer | PDFDocument
  check?: boolean
  level?: string
  flavor?: string
}) {
  let file = null

  const pdfDoc = await resolvePdf(options.pdf)
  
  const attachments = extractAttachments(pdfDoc)

  if (attachments?.length) {
    for (const attachment of attachments) {
      if (attachment.name === FACTURX_FILENAME) {
        if (!options.flavor || options.flavor === 'facturx') {
          options.flavor = 'facturx'
        }
        else {
          throw new Error(`Invalid flavor, expected ${options.flavor} but found facturx`)
        }
        file = attachment
        break
      }
      if (attachment.name === ORDERX_FILENAME) {
        if (!options.flavor || options.flavor === 'orderx') {
          options.flavor = 'orderx'
        }
        else {
          throw new Error(`Invalid flavor, expected ${options.flavor} but found orderx`)
        }

        file = attachment
        break
      }
      if (ZUGFERD_FILENAMES.includes(attachment.name)) {
        if (!options.flavor || options.flavor === 'zugferd') {
          options.flavor = 'zugferd'
        }
        else {
          throw new Error(`Invalid flavor, expected ${options.flavor} but found zugferd`)
        }
        file = attachment
        break
      }
    }
  }

  if (!file) {
    throw new Error('No attachment found')
  }

  const xmlDoc = await parseXmlAsync(Buffer.from(file.data), {
    encoding: 'utf8',
  })

  if (options.check !== true && !await check({
    xml: xmlDoc,
    flavor: options.flavor,
    level: options.level,
  })) {
    throw new Error('Invalid XML')
  }

  return [file.name, xmlDoc.toString()] as const
}

export async function check(options: {
  xml: string | Buffer | XMLDocument,
  flavor?: string,
  level?: string,
}): Promise<boolean> {
  const xmlDoc = await resolveXml(options.xml)

  options.flavor ||= getFlavor(xmlDoc)
  options.level ||= getLevel(xmlDoc)

  const xsdDoc = await getXsd(options.flavor, options.level)
  return xmlDoc.validate(xsdDoc) as boolean
}
