import { Document as XMLDocument } from "libxmljs2";

const xmlnsRe = /xmlns:([^=]+)="([^"]+)"/g

export function extractNamespaces(fileDoc: XMLDocument) {
  // segfault - https://github.com/libxmljs/libxmljs/issues/649
  // const namespaces = fileDoc.namespaces()
  const str = fileDoc.toString()

  const namespaces: Record<string, string> = {}

  let match: RegExpExecArray | null
  while ((match = xmlnsRe.exec(str)) !== null) {
    namespaces[match[1]] = match[2]
  }

  return namespaces
}