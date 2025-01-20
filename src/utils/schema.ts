import { readFile } from 'node:fs/promises'
import { resolve, join, dirname } from 'node:path'
import { format, parse } from 'date-fns'

import { XMLDocument, XMLElement } from 'libxmljs'
import { extractNamespaces } from '../utils/xml'
import {
  BaseInfo,
  DOC_TYPE,
  DOC_TYPE_KEY,
  FACTURX_SCHEMA,
  FACTURX_SCHEMA_TYPE,
  ORDERX_SCHEMA,
  ORDERX_SCHEMA_TYPE,
  PdfMetadata,
} from '../constants'
import { resolveXml } from './resolve'

const _cache = {} as Record<string, Record<string, XMLDocument>>

export async function getXsd(flavor: string, level: string, cache = true) {
  if (cache && flavor in _cache && level in _cache[flavor]) {
    return _cache[flavor][level]
  }

  switch (flavor) {
    case 'facturx': {
      const schema = await getFacturxXsd(level as FACTURX_SCHEMA_TYPE)
      if (cache) {
        _cache[flavor] ||= {}
        _cache[flavor][level] = schema
      }
      return schema
    }
    case 'orderx': {
      const schema = await getOrderxXsd(level as ORDERX_SCHEMA_TYPE)
      if (cache) {
        _cache[flavor] ||= {}
        _cache[flavor][level] = schema
      }
      return schema
    }
    default:
      throw new Error(`Unknown schema flavor: "${flavor}"`)
  }
}
export async function getFacturxXsd(level: FACTURX_SCHEMA_TYPE) {
  if (!level || !(level in FACTURX_SCHEMA)) {
    throw new Error(`Unknown Factur-X level: "${level}"`)
  }

  const dir = dirname(new URL(import.meta.url).pathname);
  const url = resolve(join(dir, "..", FACTURX_SCHEMA[level]));
  const buffer = await readFile(url)
  
  return await resolveXml(buffer, {
    url,
  })
}
export async function getOrderxXsd(level: ORDERX_SCHEMA_TYPE) {
  if (!level || !(level in ORDERX_SCHEMA)) {
    throw new Error(`Unknown Order-X level: "${level}"`)
  }

  const dir = dirname(new URL(import.meta.url).pathname);
  const url = resolve(join(dir, "..", ORDERX_SCHEMA[level]));
  const buffer = await readFile(url)

  return await resolveXml(buffer, {
    url,
  })
}

export function getLevel(fileDoc: XMLDocument) {
  const namespaces = extractNamespaces(fileDoc)

  // Factur-X and Order-X
  let doc_id_xpath = fileDoc.find([
    "//rsm:ExchangedDocumentContext",
    "/ram:GuidelineSpecifiedDocumentContextParameter",
    "/ram:ID",
  ].join(''), namespaces)
  
  if (!doc_id_xpath.length) {
    // ZUGFeRD 1.0
    doc_id_xpath = fileDoc.find([
      "//rsm:SpecifiedExchangedDocumentContext",
      "/ram:GuidelineSpecifiedDocumentContextParameter",
      "/ram:ID",
    ].join(''), namespaces)
  }
  if (!doc_id_xpath.length) {
    throw new Error('No ID found in the document')
  }
  const xpathNode = doc_id_xpath[0]

  if (!('text' in xpathNode)) {
    throw new Error('No text found in the ID node')
  }

  const doc_id = xpathNode?.text()?.split(':')
  let level = doc_id[doc_id.length - 1]

  const possibleValues = new Set([...Object.keys(FACTURX_SCHEMA), ...Object.keys(ORDERX_SCHEMA)])
  if (!possibleValues.has(level)) {
    // Order-X
    level = doc_id[doc_id.length - 2] // skip the last part (date revision)
  }
  if (!possibleValues.has(level)) {
    throw new Error(`Unknown level: "${level}"`)
  }
  return level
}

export function getFlavor(fileDoc: XMLDocument) {
  const tag = fileDoc.root()?.name()
  switch (tag) {
    case 'SCRDMCCBDACIOMessageStructure':
      return 'orderx'
    case 'CrossIndustryInvoice':
      return 'facturx'
    case 'CrossIndustryDocument':
      return 'zugferd'
  }
  throw new Error(`XML not recognized as Factur-X, Order-X or ZUGFeRD`)
}

// export function getOrderXLevel(fileDoc) {
//   // segfault - https://github.com/libxmljs/libxmljs/issues/649
//   // const namespaces = fileDoc.namespaces()
//   const namespaces = {
//     rsm: 'urn:un:unece:uncefact:data:SCRDMCCBDACIOMessageStructure:100',
//     udt: 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:128',
//     qdt: 'urn:un:unece:uncefact:data:standard:QualifiedDataType:128',
//     ram: 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:128',
//     xsi: 'http://www.w3.org/2001/XMLSchema-instance',
//   }

//   const type_code_xpath = fileDoc.find([
//     "/rsm:SCRDMCCBDACIOMessageStructure",
//     "/rsm:ExchangedDocument",
//     "/ram:TypeCode",
//   ].join(''), namespaces)

//   if (!type_code_xpath.length) {
//     throw new Error('No Type Code found in the document')
//   }

//   const type_code = type_code_xpath[0].text().split(':')
//   console.log('type_code', type_code)

//   let level = type_code[type_code.length - 1]
//   // if (!doc_id_xpath.length) {
//   //   throw new Error('No ID found in the document')
//   // }
//   // const doc_id = doc_id_xpath[0].text().split(':')
//   // let level = doc_id[doc_id.length - 1]

//   // const possibleValues = Object.keys(facturx)
//   // if (!possibleValues.includes(level)) {
//   //   level = doc_id[doc_id.length - 2]
//   // }
//   // if (!possibleValues.includes(level)) {
//   //   throw new Error(`Unknown level: "${level}"`)
//   // }
//   return level
// }

export async function extractBaseInfo(xml: string | Buffer | XMLDocument): Promise<BaseInfo> {
  const xmlDoc = await resolveXml(xml)

  const namespaces = extractNamespaces(xmlDoc)

  const dateXPath = xmlDoc.find([
    "//rsm:ExchangedDocument",
    "/ram:IssueDateTime",
    "/udt:DateTimeString",
  ].join(''), namespaces)

  const dateEl = dateXPath[0] as XMLElement
  const dateStr = dateEl?.text()
  const dateFormat = dateEl.getAttribute('format')?.value() || '102'
  const formatMap = {
    '102': 'yyyyMMdd',
    '203': 'yyyyMMddHHmm',
  } as const
  const date = parse(dateStr, formatMap[dateFormat as keyof typeof formatMap], new Date())

  const numberXPath = xmlDoc.find([
    "//rsm:ExchangedDocument",
    "/ram:ID",
  ].join(''), namespaces)
  const numberEl = numberXPath[0] as XMLElement
  const number = numberEl?.text()

  const sellerXPath = xmlDoc.find([
    "//ram:ApplicableHeaderTradeAgreement",
    "/ram:SellerTradeParty",
    "/ram:Name",
  ].join(''), namespaces)
  const sellerEl = sellerXPath[0] as XMLElement
  const seller = sellerEl?.text()

  const buyerXPath = xmlDoc.find([
    "//ram:ApplicableHeaderTradeAgreement",
    "/ram:BuyerTradeParty",
    "/ram:Name",
  ].join(''), namespaces)
  const buyerEl = buyerXPath[0] as XMLElement
  const buyer = buyerEl?.text()

  const docTypeXPath = xmlDoc.find([
    "//rsm:ExchangedDocument",
    "/ram:TypeCode",
  ].join(''), namespaces)
  const docTypeEl = docTypeXPath[0] as XMLElement
  const docType = docTypeEl?.text() as DOC_TYPE_KEY

  return {
    'seller': seller,
    'buyer': buyer,
    'number': number,
    'date': date,
    'docType': docType,
  }
}

export function baseInfo2PdfMetadata(info: BaseInfo): PdfMetadata {
  let title = ''
  let subject = ''
  let doc_x = ''
  let author = ''

  const doc_type_name = DOC_TYPE[info.docType] || 'Invoice'
  const date = format(info.date, 'yyyy-MM-dd')

  // Order Response
  if (info.docType === '231') {
    title = `${info.seller}: Order Response on Order ${info.number} from ${info.buyer}`
    subject = `Response of ${info.seller} on ${date} to order ${info.number} from ${info.buyer}`
    doc_x = `Order-X`
    author = info.seller
  }
  // Order & Order Change
  else if (['220', '230'].includes(info.docType)) {
    title = `${info.buyer}: ${doc_type_name} ${info.number}`
    subject = `${doc_type_name} ${info.number} issued by ${info.buyer} on ${date}`
    doc_x = `Order-X`
    author = info.buyer
  }
  // Invoice & Refund
  else {
    title = `${info.seller}: ${doc_type_name} ${info.number}`
    subject = `${doc_type_name} ${info.number} dated ${date} issued by ${info.seller}`
    doc_x = `Factur-X`
    author = info.seller
  }

  return {
    title,
    subject,
    author,
    keywords: [doc_type_name, doc_x],
  }
}