import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { parseXmlAsync, XMLDocument, XMLParseOptions } from "libxmljs"
import { LoadOptions, PDFDocument } from "pdf-lib"

export async function resolveXml(
  xml: string | Buffer | XMLDocument,
  options: XMLParseOptions = {
    encoding: 'utf8',
  }
): Promise<XMLDocument> {
  if (xml instanceof XMLDocument) {
    return xml
  }

  if (xml instanceof Buffer) {
    return parseXmlAsync(xml, options)
  }

  const buffer = await readFile(resolve(xml))
  return parseXmlAsync(buffer, options)
}


export async function resolvePdf(
  pdf: string | Buffer | PDFDocument,
  options: LoadOptions = {}
): Promise<PDFDocument> {
  if (pdf instanceof PDFDocument) {
    return pdf
  }

  if (pdf instanceof Buffer) {
    return await PDFDocument.load(pdf, options)
  }

  const buffer = await readFile(resolve(pdf))
  return await PDFDocument.load(buffer, options)
}