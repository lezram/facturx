import { Buffer } from "node:buffer";
import {
  parseXml as parseXmlAsync,
  Document as XMLDocument,
  ParserOptions as XMLParseOptions,
} from "libxmljs2";
import { LoadOptions, PDFDocument } from "pdf-lib";

export async function resolveXml(
  xml: string | Buffer | XMLDocument,
  options = {
    encoding: "utf8",
  }
): Promise<XMLDocument> {
  if (xml instanceof XMLDocument) {
    return xml;
  }

  if (xml instanceof Buffer) {
    xml = xml.toString("utf8");
  }

  return await parseXmlAsync(xml as string);
}

export async function resolvePdf(
  pdf: string | Buffer | PDFDocument,
  options: LoadOptions = {}
): Promise<PDFDocument> {
  if (pdf instanceof PDFDocument) {
    return pdf;
  }

  return await PDFDocument.load(pdf, options);
}
