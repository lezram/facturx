'use strict';

const node_buffer = require('node:buffer');
const _package = require('./shared/facturx.CLM8316h.cjs');
const pdfLib = require('pdf-lib');
const promises = require('node:fs/promises');
const node_path = require('node:path');
const dateFns = require('date-fns');
const libxmljs = require('libxmljs');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
const extractRawAttachments = (pdfDoc) => {
  if (!pdfDoc.catalog.has(pdfLib.PDFName.of("Names"))) return [];
  const Names = pdfDoc.catalog.lookup(pdfLib.PDFName.of("Names"), pdfLib.PDFDict);
  if (!Names.has(pdfLib.PDFName.of("EmbeddedFiles"))) return [];
  const EmbeddedFiles = Names.lookup(pdfLib.PDFName.of("EmbeddedFiles"), pdfLib.PDFDict);
  if (!EmbeddedFiles.has(pdfLib.PDFName.of("Names"))) return [];
  const EFNames = EmbeddedFiles.lookup(pdfLib.PDFName.of("Names"), pdfLib.PDFArray);
  const rawAttachments = [];
  for (let idx = 0, len = EFNames.size(); idx < len; idx += 2) {
    const fileName = EFNames.lookup(idx);
    const fileSpec = EFNames.lookup(idx + 1, pdfLib.PDFDict);
    rawAttachments.push({ fileName, fileSpec });
  }
  return rawAttachments;
};
const extractAttachments = (pdfDoc) => {
  const rawAttachments = extractRawAttachments(pdfDoc);
  return rawAttachments.map(({ fileName, fileSpec }) => {
    const stream = fileSpec.lookup(pdfLib.PDFName.of("EF"), pdfLib.PDFDict).lookup(pdfLib.PDFName.of("F"), pdfLib.PDFStream);
    return {
      name: fileName.decodeText(),
      data: pdfLib.decodePDFRawStream(stream).decode()
    };
  });
};

const xmlnsRe = /xmlns:([^=]+)="([^"]+)"/g;
function extractNamespaces(fileDoc) {
  const str = fileDoc.toString();
  const namespaces = {};
  let match;
  while ((match = xmlnsRe.exec(str)) !== null) {
    namespaces[match[1]] = match[2];
  }
  return namespaces;
}

const FACTURX_FILENAME = "factur-x.xml";
const ZUGFERD_FILENAMES = ["zugferd-invoice.xml", "ZUGFeRD-invoice.xml"];
const ORDERX_FILENAME = "order-x.xml";
const FACTURX_SCHEMA = {
  "basic": "./schema/facturx/basic/FACTUR-X_BASIC.xsd",
  "basic-wl": "./schema/facturx/basic-wl/FACTUR-X_BASIC-WL.xsd",
  "en16931": "./schema/facturx/en16931/FACTUR-X_EN16931.xsd",
  "extended": "./schema/facturx/extended/FACTUR-X_EXTENDED.xsd",
  "minimum": "./schema/facturx/minimum/FACTUR-X_MINIMUM.xsd"
};
const ORDERX_SCHEMA = {
  "basic": "./schema/orderx/basic/SCRDMCCBDACIOMessageStructure_100pD20B.xsd",
  "comfort": "./schema/orderx/comfort/SCRDMCCBDACIOMessageStructure_100pD20B.xsd",
  "extended": "./schema/orderx/extended/SCRDMCCBDACIOMessageStructure_100pD20B.xsd"
};
const DOC_TYPE = {
  "220": "Order",
  "230": "Order Change",
  "231": "Order Response",
  "380": "Invoice",
  "381": "Refund"
};

async function resolveXml(xml, options = {
  encoding: "utf8"
}) {
  if (xml instanceof libxmljs.XMLDocument) {
    return xml;
  }
  return await libxmljs.parseXmlAsync(xml, options);
}
async function resolvePdf(pdf, options = {}) {
  if (pdf instanceof pdfLib.PDFDocument) {
    return pdf;
  }
  return await pdfLib.PDFDocument.load(pdf, options);
}

const _cache = {};
async function getXsd(flavor, level, cache = true) {
  if (cache && flavor in _cache && level in _cache[flavor]) {
    return _cache[flavor][level];
  }
  switch (flavor) {
    case "facturx": {
      const schema = await getFacturxXsd(level);
      if (cache) {
        _cache[flavor] ||= {};
        _cache[flavor][level] = schema;
      }
      return schema;
    }
    case "orderx": {
      const schema = await getOrderxXsd(level);
      if (cache) {
        _cache[flavor] ||= {};
        _cache[flavor][level] = schema;
      }
      return schema;
    }
    default:
      throw new Error(`Unknown schema flavor: "${flavor}"`);
  }
}
async function getFacturxXsd(level) {
  if (!level || !(level in FACTURX_SCHEMA)) {
    throw new Error(`Unknown Factur-X level: "${level}"`);
  }
  const dir = node_path.dirname(new URL((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('index.cjs', document.baseURI).href))).pathname);
  const url = node_path.resolve(node_path.join(dir, "..", FACTURX_SCHEMA[level]));
  const buffer = await promises.readFile(url);
  return await resolveXml(buffer, {
    url
  });
}
async function getOrderxXsd(level) {
  if (!level || !(level in ORDERX_SCHEMA)) {
    throw new Error(`Unknown Order-X level: "${level}"`);
  }
  const dir = node_path.dirname(new URL((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('index.cjs', document.baseURI).href))).pathname);
  const url = node_path.resolve(node_path.join(dir, "..", ORDERX_SCHEMA[level]));
  const buffer = await promises.readFile(url);
  return await resolveXml(buffer, {
    url
  });
}
function getLevel(fileDoc) {
  const namespaces = extractNamespaces(fileDoc);
  let doc_id_xpath = fileDoc.find([
    "//rsm:ExchangedDocumentContext",
    "/ram:GuidelineSpecifiedDocumentContextParameter",
    "/ram:ID"
  ].join(""), namespaces);
  if (!doc_id_xpath.length) {
    doc_id_xpath = fileDoc.find([
      "//rsm:SpecifiedExchangedDocumentContext",
      "/ram:GuidelineSpecifiedDocumentContextParameter",
      "/ram:ID"
    ].join(""), namespaces);
  }
  if (!doc_id_xpath.length) {
    throw new Error("No ID found in the document");
  }
  const xpathNode = doc_id_xpath[0];
  if (!("text" in xpathNode)) {
    throw new Error("No text found in the ID node");
  }
  const doc_id = xpathNode?.text()?.split(":");
  let level = doc_id[doc_id.length - 1];
  const possibleValues = /* @__PURE__ */ new Set([...Object.keys(FACTURX_SCHEMA), ...Object.keys(ORDERX_SCHEMA)]);
  if (!possibleValues.has(level)) {
    level = doc_id[doc_id.length - 2];
  }
  if (!possibleValues.has(level)) {
    throw new Error(`Unknown level: "${level}"`);
  }
  return level;
}
function getFlavor(fileDoc) {
  const tag = fileDoc.root()?.name();
  switch (tag) {
    case "SCRDMCCBDACIOMessageStructure":
      return "orderx";
    case "CrossIndustryInvoice":
      return "facturx";
    case "CrossIndustryDocument":
      return "zugferd";
  }
  throw new Error(`XML not recognized as Factur-X, Order-X or ZUGFeRD`);
}
async function extractBaseInfo(xml) {
  const xmlDoc = await resolveXml(xml);
  const namespaces = extractNamespaces(xmlDoc);
  const dateXPath = xmlDoc.find([
    "//rsm:ExchangedDocument",
    "/ram:IssueDateTime",
    "/udt:DateTimeString"
  ].join(""), namespaces);
  const dateEl = dateXPath[0];
  const dateStr = dateEl?.text();
  const dateFormat = dateEl.getAttribute("format")?.value() || "102";
  const formatMap = {
    "102": "yyyyMMdd",
    "203": "yyyyMMddHHmm"
  };
  const date = dateFns.parse(dateStr, formatMap[dateFormat], /* @__PURE__ */ new Date());
  const numberXPath = xmlDoc.find([
    "//rsm:ExchangedDocument",
    "/ram:ID"
  ].join(""), namespaces);
  const numberEl = numberXPath[0];
  const number = numberEl?.text();
  const sellerXPath = xmlDoc.find([
    "//ram:ApplicableHeaderTradeAgreement",
    "/ram:SellerTradeParty",
    "/ram:Name"
  ].join(""), namespaces);
  const sellerEl = sellerXPath[0];
  const seller = sellerEl?.text();
  const buyerXPath = xmlDoc.find([
    "//ram:ApplicableHeaderTradeAgreement",
    "/ram:BuyerTradeParty",
    "/ram:Name"
  ].join(""), namespaces);
  const buyerEl = buyerXPath[0];
  const buyer = buyerEl?.text();
  const docTypeXPath = xmlDoc.find([
    "//rsm:ExchangedDocument",
    "/ram:TypeCode"
  ].join(""), namespaces);
  const docTypeEl = docTypeXPath[0];
  const docType = docTypeEl?.text();
  return {
    "seller": seller,
    "buyer": buyer,
    "number": number,
    "date": date,
    "docType": docType
  };
}
function baseInfo2PdfMetadata(info) {
  let title = "";
  let subject = "";
  let doc_x = "";
  let author = "";
  const doc_type_name = DOC_TYPE[info.docType] || "Invoice";
  const date = dateFns.format(info.date, "yyyy-MM-dd");
  if (info.docType === "231") {
    title = `${info.seller}: Order Response on Order ${info.number} from ${info.buyer}`;
    subject = `Response of ${info.seller} on ${date} to order ${info.number} from ${info.buyer}`;
    doc_x = `Order-X`;
    author = info.seller;
  } else if (["220", "230"].includes(info.docType)) {
    title = `${info.buyer}: ${doc_type_name} ${info.number}`;
    subject = `${doc_type_name} ${info.number} issued by ${info.buyer} on ${date}`;
    doc_x = `Order-X`;
    author = info.buyer;
  } else {
    title = `${info.seller}: ${doc_type_name} ${info.number}`;
    subject = `${doc_type_name} ${info.number} dated ${date} issued by ${info.seller}`;
    doc_x = `Factur-X`;
    author = info.seller;
  }
  return {
    title,
    subject,
    author,
    keywords: [doc_type_name, doc_x]
  };
}

class InvalidXmlError extends Error {
  constructor(message, errors) {
    super(message);
    this.errors = errors;
    this.name = "InvalidXmlError";
  }
}
async function generate(options) {
  const xml = await resolveXml(options.xml);
  options.flavor ||= getFlavor(xml);
  options.level ||= getLevel(xml);
  if (options.check === true && !await check({
    xml,
    flavor: options.flavor,
    level: options.level
  })) {
    throw new InvalidXmlError(
      `Invalid XML format (${options.flavor} - ${options.level})`,
      xml.validationErrors
    );
  }
  let meta = options.meta;
  if (!meta) {
    const info = await extractBaseInfo(xml);
    meta = baseInfo2PdfMetadata(info);
  }
  let description = "";
  let filename = "";
  switch (options.flavor) {
    case "facturx":
      filename = FACTURX_FILENAME;
      description = "Factur-X XML file";
      break;
    case "orderx":
      filename = ORDERX_FILENAME;
      description = "Order-X XML file";
      break;
    case "zugferd":
      filename = ZUGFERD_FILENAMES[0];
      description = "ZUGFeRD XML file";
      break;
    default:
      throw new Error(`Unknown schema flavor: "${options.flavor}"`);
  }
  const now = /* @__PURE__ */ new Date();
  const pdf = await resolvePdf(options.pdf);
  const xmlString = xml.toString({ type: "xml" });
  const uint8array = new TextEncoder().encode(xmlString);
  await pdf.attach(uint8array, filename, {
    afRelationship: pdfLib.AFRelationship.Data,
    mimeType: "application/xml",
    creationDate: now,
    modificationDate: now,
    description
  });
  if (options.language) {
    pdf.setLanguage(options.language);
  }
  pdf.setCreationDate(now);
  pdf.setModificationDate(now);
  pdf.setTitle(meta.title);
  pdf.setSubject(meta.subject);
  pdf.setAuthor(meta.author);
  pdf.setKeywords(meta.keywords);
  pdf.setCreator(
    `${_package.pkg.name} npm lib v${_package.pkg.version} (https://github.com/${_package.pkg.repository})`
  );
  return await pdf.save();
}
async function extract(options) {
  let file = null;
  const pdf = await resolvePdf(options.pdf);
  const attachments = extractAttachments(pdf);
  if (attachments?.length) {
    for (const attachment of attachments) {
      if (attachment.name === FACTURX_FILENAME) {
        if (!options.flavor || options.flavor === "facturx") {
          options.flavor = "facturx";
        } else {
          throw new Error(
            `Invalid flavor, expected ${options.flavor} but found facturx`
          );
        }
        file = attachment;
        break;
      }
      if (attachment.name === ORDERX_FILENAME) {
        if (!options.flavor || options.flavor === "orderx") {
          options.flavor = "orderx";
        } else {
          throw new Error(
            `Invalid flavor, expected ${options.flavor} but found orderx`
          );
        }
        file = attachment;
        break;
      }
      if (ZUGFERD_FILENAMES.includes(attachment.name)) {
        if (!options.flavor || options.flavor === "zugferd") {
          options.flavor = "zugferd";
        } else {
          throw new Error(
            `Invalid flavor, expected ${options.flavor} but found zugferd`
          );
        }
        file = attachment;
        break;
      }
    }
  }
  if (!file) {
    throw new Error("No attachment found");
  }
  const xml = await resolveXml(node_buffer.Buffer.from(file.data));
  if (options.check === true && !await check({
    xml,
    flavor: options.flavor,
    level: options.level
  })) {
    throw new Error("Invalid XML");
  }
  return [file.name, xml.toString()];
}
async function check(options) {
  const xml = await resolveXml(options.xml);
  options.flavor ||= getFlavor(xml);
  options.level ||= getLevel(xml);
  const xsd = await getXsd(options.flavor, options.level);
  return xml.validate(xsd);
}

exports.InvalidXmlError = InvalidXmlError;
exports.check = check;
exports.extract = extract;
exports.generate = generate;
