# Factur-X and Order-X JS library

Generate and extract Factur-X and Order-X invoices in TypeScript, using [pdf-lib](https://github.com/Hopding/pdf-lib) and [libxmljs](https://github.com/libxmljs/libxmljs).

## Usage

### CLI

```bash
# Usage (Node.js)
npx @stafyniaksacha/facturx --help

# Usage (Bun)
bunx @stafyniaksacha/facturx --help
```

```bash
# Generate a Factur-X/Order-X PDF-A/3 invoice
npx @stafyniaksacha/facturx generate \
  --pdf input.pdf \
  --xml input.xml \
  --output output.pdf

# Extract a Factur-X/Order-X XML from a PDF
npx @stafyniaksacha/facturx extract input.pdf > output.xml

# Check a Factur-X/Order-X XML file
npx @stafyniaksacha/facturx check input.xml \
  --flavor facturx \ # autodetects the flavor if not provided
  --level en16931 # autodetects the level if not provided
```

### Node.js


```bash
npm install @stafyniaksacha/facturx
```

```typescript
import { readFile } from 'node:fs/promises' 

import { generate, extract, check } from '@stafyniaksacha/facturx'

const pdf = await readFile('/path/to/input.pdf')
const xml = await readFile('/path/to/input.xml')

// Generate a Factur-X/Order-X PDF-A/3 invoice
const buffer = await generate({
  pdf, // string, buffer or PDFDocument
  xml, // string, buffer or XMLDocument

  // Optional
  check: true, // set to false to disable the check
  flavor: 'facturx', // autodetects the flavor if not provided
  level: 'en16931', // autodetects the level if not provided
  language: 'en-GB',
  meta: { // extracted from xml if not provided
    author: 'John Doe',
    title: 'John Doe',
    subject: 'John Doe',
    keywords: ['John', 'Doe'],
  },
})

// Extract a Factur-X/Order-X XML from a PDF
const [filename, content] = await extract({
  pdf, // string, buffer or PDFDocument

  // Optional
  check: true, // set to false to disable the check
  flavor: 'facturx', // autodetects the flavor if not provided
  level: 'en16931', // autodetects the level if not provided
})

// Extract a Factur-X/Order-X XML from a PDF
const valid = await check({
  xml, // string, buffer or XMLDocument

  // Optional
  flavor: 'facturx', // autodetects the flavor if not provided
  level: 'en16931', // autodetects the level if not provided
})
```

## Usefull links

- https://fnfe-mpe.org/factur-x/
- https://fnfe-mpe.org/factur-x/order-x/

## License

Based on original work of [`akretion/factur-x`](https://github.com/akretion/factur-x) python library by [`Alexis de Lattre`](https://github.com/alexis-via)
