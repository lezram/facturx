export const FACTURX_FILENAME = 'factur-x.xml'
export const ZUGFERD_FILENAMES = ['zugferd-invoice.xml', 'ZUGFeRD-invoice.xml']
export const ORDERX_FILENAME = 'order-x.xml'

export type FACTURX_SCHEMA_TYPE = keyof typeof FACTURX_SCHEMA
export const FACTURX_SCHEMA = {
  'basic': './schema/facturx/basic/FACTUR-X_BASIC.xsd',
  'basic-wl': './schema/facturx/basic-wl/FACTUR-X_BASIC-WL.xsd',
  'en16931': './schema/facturx/en16931/FACTUR-X_EN16931.xsd',
  'extended': './schema/facturx/extended/FACTUR-X_EXTENDED.xsd',
  'minimum': './schema/facturx/minimum/FACTUR-X_MINIMUM.xsd',
} as const

export type ORDERX_SCHEMA_TYPE = keyof typeof ORDERX_SCHEMA
export const ORDERX_SCHEMA = {
  'basic': './schema/orderx/basic/SCRDMCCBDACIOMessageStructure_100pD20B.xsd',
  'comfort': './schema/orderx/comfort/SCRDMCCBDACIOMessageStructure_100pD20B.xsd',
  'extended': './schema/orderx/extended/SCRDMCCBDACIOMessageStructure_100pD20B.xsd',
} as const

export type DOC_TYPE_KEY = keyof typeof DOC_TYPE
export const DOC_TYPE = {
  '220': 'Order',
  '230': 'Order Change',
  '231': 'Order Response',
  '380': 'Invoice',
  '381': 'Refund',
} as const

export type BaseInfo = {
  seller: string
  buyer: string
  number: string
  date: Date
  docType: DOC_TYPE_KEY
}
export type PdfMetadata = {
  author: string
  title: string
  subject: string
  keywords: string[]
}