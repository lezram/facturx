import { Buffer } from 'node:buffer';
import { Document } from 'libxmljs2';
import { PDFDocument } from 'pdf-lib';

type PdfMetadata = {
    author: string;
    title: string;
    subject: string;
    keywords: string[];
};

declare class InvalidXmlError extends Error {
    readonly errors: any[];
    constructor(message: string, errors: any[]);
}
declare function generate(options: {
    pdf: string | Buffer | PDFDocument;
    xml: string | Buffer | Document;
    check?: boolean;
    flavor?: string;
    level?: string;
    language?: string;
    meta?: PdfMetadata;
}): Promise<Uint8Array<ArrayBufferLike>>;
declare function extract(options: {
    pdf: string | Buffer | PDFDocument;
    check?: boolean;
    level?: string;
    flavor?: string;
}): Promise<readonly [string, string]>;
declare function check(options: {
    xml: string | Buffer | Document;
    flavor?: string;
    level?: string;
}): Promise<boolean>;

export { InvalidXmlError, check, extract, generate };
