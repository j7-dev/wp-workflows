---
name: pdf-lib
user-invocable: false
description: >
  pdf-lib v1.17 complete technical reference for creating and modifying PDF documents in JavaScript/TypeScript.
  Covers PDFDocument, PDFPage, PDFFont, PDFImage, PDFForm, color system, coordinate system, and all drawing APIs.
  Use this skill whenever the user's code involves pdf-lib, PDFDocument.create(), PDFDocument.load(),
  page.drawText(), page.drawImage(), embedFont(), embedPng(), embedJpg(), pdf merging/splitting,
  PDF form filling, PDF watermark, or any import from 'pdf-lib'.
  Also use when the task involves generating PDFs in Node.js or browser, modifying existing PDFs,
  embedding fonts (especially CJK/Chinese/Japanese/Korean), PDF page manipulation, PDF metadata,
  PDF attachments, PDF form creation, or converting PDF to base64/data URI.
  This skill replaces the need to search the web for pdf-lib documentation.
---

# pdf-lib v1.17

> **Version**: 1.17.1 (latest stable) | **Source**: https://pdf-lib.js.org/ | **Repo**: https://github.com/Hopding/pdf-lib | **Last updated**: 2026-03-15

Pure JavaScript library for creating and modifying PDF documents. Works in browsers, Node.js, Deno, and React Native. Written in TypeScript with no native dependencies.

## Installation

```bash
# npm
npm install pdf-lib

# For custom font support (TTF/OTF)
npm install @pdf-lib/fontkit
# OR for CJK font subsetting fix:
npm install pdf-fontkit
```

**CDN/UMD**:
```html
<script src="https://unpkg.com/pdf-lib"></script>
<!-- Available as window.PDFLib -->
```

## Coordinate System

PDF coordinate origin is at the **bottom-left** corner. Y increases **upward**. Units are PDF points (1 point = 1/72 inch). A standard US Letter page is 612 x 792 points. A4 is approximately 595 x 842 points.

```
(0, 792) ---- (612, 792)   <- top
   |              |
   |              |
(0, 0) ---- (612, 0)       <- bottom (origin)
```

## Core API Quick Reference

### PDFDocument (create / load / save)

```typescript
import { PDFDocument, StandardFonts, rgb, degrees, ParseSpeeds } from 'pdf-lib'
import type { PDFPage, PDFFont, PDFImage } from 'pdf-lib'

// Create new
const pdfDoc: PDFDocument = await PDFDocument.create()

// Load existing (accepts ArrayBuffer, Uint8Array, base64 string, or data URI)
const pdfDoc: PDFDocument = await PDFDocument.load(existingPdfBytes, {
  ignoreEncryption: false,  // set true to attempt loading encrypted PDFs
  parseSpeed: ParseSpeeds.Slow, // Slow | Medium | Fast (default Medium)
  updateMetadata: true,
  throwOnInvalidObject: false,
  capNumbers: false,
})

// Save
const pdfBytes: Uint8Array = await pdfDoc.save()                     // Uint8Array
const base64: string = await pdfDoc.saveAsBase64()                   // base64 string
const dataUri: string = await pdfDoc.saveAsBase64({ dataUri: true }) // data URI
```

### Page Operations

```typescript
const page = pdfDoc.addPage()                    // default Letter size
const page = pdfDoc.addPage([595, 842])          // custom size [width, height]
const page = pdfDoc.insertPage(0)                // insert at index
const page = pdfDoc.insertPage(0, [595, 842])    // insert with size
pdfDoc.removePage(0)                             // remove by index
const pages = pdfDoc.getPages()                  // PDFPage[]
const page = pdfDoc.getPage(0)                   // single page by index
const count = pdfDoc.getPageCount()
const { width, height } = page.getSize()
```

### drawText (most common operation)

```typescript
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'

page.drawText('Hello World', {
  x: 50,                          // horizontal position from left
  y: 500,                         // vertical position from bottom
  size: 24,                       // font size in points
  font: helveticaFont,            // PDFFont (default: Helvetica)
  color: rgb(0, 0, 0),            // Color (default: black)
  opacity: 1,                     // 0-1
  rotate: degrees(0),             // Rotation
  lineHeight: 24,                 // for multiline text
  maxWidth: 500,                  // auto-wrap at this width
  wordBreaks: [' '],              // characters to break on
  blendMode: BlendMode.Normal,
  xSkew: degrees(0),              // horizontal skew
  ySkew: degrees(0),              // vertical skew
})
```

### Image Embedding

```typescript
const jpgImage = await pdfDoc.embedJpg(jpgBytes)   // ArrayBuffer | Uint8Array | base64
const pngImage = await pdfDoc.embedPng(pngBytes)

// Get dimensions and scale
const { width, height } = pngImage.size()
const dims = pngImage.scale(0.5)                   // { width, height }
const fitted = pngImage.scaleToFit(200, 200)       // fit within bounds

page.drawImage(pngImage, {
  x: 50,
  y: 50,
  width: dims.width,
  height: dims.height,
  opacity: 0.5,
  rotate: degrees(0),
  blendMode: BlendMode.Normal,
})
```

### Font Embedding (CJK critical)

```typescript
import fontkit from '@pdf-lib/fontkit'  // or 'pdf-fontkit' for CJK fix

// Standard fonts (no fontkit needed, but NO CJK support)
const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

// Custom TTF/OTF fonts (REQUIRED for CJK)
pdfDoc.registerFontkit(fontkit)  // MUST register before embedFont with custom fonts
const fontBytes = fs.readFileSync('NotoSansCJK-Regular.ttf')
const customFont = await pdfDoc.embedFont(fontBytes, {
  subset: false,   // IMPORTANT: set false for CJK or use pdf-fontkit
  customName: 'NotoSansCJK',
})

// Measure text
const textWidth = customFont.widthOfTextAtSize('Hello', 24)
const textHeight = customFont.heightAtSize(24)
const fontSize = customFont.sizeAtHeight(30)
```

**CJK Font Subsetting Warning**: When using `subset: true` with `@pdf-lib/fontkit`, many CJK characters will be missing from the output PDF. Two workarounds:
1. Use `subset: false` (larger file size but all glyphs preserved)
2. Replace `@pdf-lib/fontkit` with `pdf-fontkit` which fixes the subsetting bug

### Color System

```typescript
import { rgb, cmyk, grayscale } from 'pdf-lib'

rgb(0, 0.53, 0.71)        // r, g, b: each 0-1
cmyk(0, 0, 0, 1)          // c, m, y, k: each 0-1
grayscale(0.5)             // 0 (black) to 1 (white)
```

### Rotation Helpers

```typescript
import { degrees, radians } from 'pdf-lib'

degrees(45)    // { type: RotationTypes.Degrees, angle: 45 }
radians(Math.PI / 4)  // { type: RotationTypes.Radians, angle: ... }
```

### PDF Merging (Copy Pages)

```typescript
const pdfA = await PDFDocument.load(pdfABytes)
const pdfB = await PDFDocument.load(pdfBBytes)
const merged = await PDFDocument.create()

const [pageA] = await merged.copyPages(pdfA, [0])  // copy page at index 0
const copiedPages = await merged.copyPages(pdfB, pdfB.getPageIndices()) // all pages

merged.addPage(pageA)
copiedPages.forEach(p => merged.addPage(p))
```

### PDF Embedding (visual overlay, not merge)

```typescript
// Embed entire PDF pages as images (for watermark/overlay)
const [embeddedPage] = await pdfDoc.embedPdf(otherPdfBytes)
// OR embed a specific page with cropping
const embeddedPage = await pdfDoc.embedPage(otherDoc.getPages()[0], {
  left: 0, bottom: 0, right: 300, top: 400  // crop bounds
})

page.drawPage(embeddedPage, {
  x: 0, y: 0,
  width: 200, height: 300,
  opacity: 0.3,  // useful for watermark
})
```

## Watermark Pattern

```typescript
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'

async function addWatermark(pdfBytes: ArrayBuffer, text: string) {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const pages = pdfDoc.getPages()

  for (const page of pages) {
    const { width, height } = page.getSize()
    const textWidth = font.widthOfTextAtSize(text, 50)
    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: 50,
      font,
      color: rgb(0.75, 0.75, 0.75),
      rotate: degrees(-45),
      opacity: 0.3,
    })
  }
  return pdfDoc.save()
}
```

## Common Pitfalls

1. **Coordinate origin is bottom-left**, not top-left. `y: 0` is the bottom of the page. To place text at the top: `y: height - fontSize`.

2. **Custom fonts require fontkit registration**. Calling `embedFont(fontBytes)` without `registerFontkit()` first will throw an error.

3. **CJK font subsetting is broken** in `@pdf-lib/fontkit`. Use `subset: false` or install `pdf-fontkit` instead.

4. **Standard fonts have no CJK glyphs**. You MUST embed a custom CJK font (e.g., Noto Sans CJK) for Chinese/Japanese/Korean text.

5. **No native encryption support**. pdf-lib cannot encrypt PDFs on save. It can attempt to load encrypted PDFs with `ignoreEncryption: true`, but this is unreliable.

6. **No built-in table drawing**. Tables must be drawn manually with `drawText`, `drawLine`, and `drawRectangle`. Community package `pdf-lib-draw-table` provides this feature.

7. **embedPdf vs copyPages**: `copyPages` creates independent pages for merging. `embedPdf/embedPage` creates an embedded visual representation (like an image) for overlays.

8. **Large font files increase PDF size significantly**. CJK fonts can be 10-20MB. Consider subsetting (with `pdf-fontkit`) or using `subset: true` for non-CJK fonts.

9. **save() options**: `useObjectStreams: true` enables compression (reduces file size but may reduce compatibility with older readers).

10. **Form flattening** converts interactive fields to static content. This is irreversible.

## StandardFonts Enum

14 built-in fonts (no fontkit required, but no CJK support):

| Enum Member | PDF Font Name |
|---|---|
| `Courier` | Courier |
| `CourierBold` | Courier-Bold |
| `CourierOblique` | Courier-Oblique |
| `CourierBoldOblique` | Courier-BoldOblique |
| `Helvetica` | Helvetica |
| `HelveticaBold` | Helvetica-Bold |
| `HelveticaOblique` | Helvetica-Oblique |
| `HelveticaBoldOblique` | Helvetica-BoldOblique |
| `TimesRoman` | Times-Roman |
| `TimesRomanBold` | Times-Bold |
| `TimesRomanItalic` | Times-Italic |
| `TimesRomanBoldItalic` | Times-BoldItalic |
| `Symbol` | Symbol |
| `ZapfDingbats` | ZapfDingbats |

## Metadata

```typescript
pdfDoc.setTitle('Document Title')
pdfDoc.setAuthor('Author Name')
pdfDoc.setSubject('Subject')
pdfDoc.setKeywords(['key1', 'key2'])
pdfDoc.setProducer('My App')
pdfDoc.setCreator('pdf-lib')
pdfDoc.setCreationDate(new Date())
pdfDoc.setModificationDate(new Date())
pdfDoc.setLanguage('zh-TW')  // RFC 3066 language tag

// Read metadata
const title = pdfDoc.getTitle()       // string | undefined
const author = pdfDoc.getAuthor()     // string | undefined
```

## Encryption & Permissions Limitations

pdf-lib does NOT support:
- Encrypting PDFs (no `encrypt()` method)
- Setting PDF permissions (print, copy, modify restrictions)
- Owner/user password protection on save
- Reliable decryption of encrypted PDFs

`PDFDocument.load(bytes, { ignoreEncryption: true })` can sometimes load encrypted PDFs, but results vary. `pdfDoc.isEncrypted` property indicates encryption status.

## References Guide

When you need deeper details, read the corresponding reference file:

| Need | File |
|---|---|
| Complete PDFDocument, PDFPage, PDFFont, PDFImage API signatures | @references/api-reference.md |
| All official code examples (create, modify, forms, images, fonts, merge) | @references/examples.md |
| Watermark, CJK fonts, table drawing, form patterns, best practices | @references/best-practices.md |
