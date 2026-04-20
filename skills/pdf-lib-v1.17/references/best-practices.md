# pdf-lib Best Practices & Patterns

> Practical patterns, CJK font handling, watermarking, table drawing, and common pitfalls for pdf-lib v1.17.

## Table of Contents

- [CJK Font Support](#cjk-font-support)
- [Watermark Patterns](#watermark-patterns)
- [Table Drawing](#table-drawing)
- [Header & Footer Patterns](#header--footer-patterns)
- [Coordinate System Tips](#coordinate-system-tips)
- [PDF Merging Strategies](#pdf-merging-strategies)
- [Form Handling Patterns](#form-handling-patterns)
- [Performance & File Size](#performance--file-size)
- [Browser vs Node.js Differences](#browser-vs-nodejs-differences)
- [Common Errors & Solutions](#common-errors--solutions)
- [TypeScript Type Imports](#typescript-type-imports)

---

## CJK Font Support

CJK (Chinese, Japanese, Korean) text requires custom font embedding. The 14 standard PDF fonts have no CJK glyphs.

### Setup

```typescript
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'  // or 'pdf-fontkit' for subsetting fix
import fs from 'fs'

async function createCJKPdf() {
  const pdfDoc = await PDFDocument.create()

  // Step 1: Register fontkit (REQUIRED for custom fonts)
  pdfDoc.registerFontkit(fontkit)

  // Step 2: Load CJK font file
  const fontBytes = fs.readFileSync('path/to/NotoSansCJKtc-Regular.ttf')

  // Step 3: Embed with subset: false (see warning below)
  const cjkFont = await pdfDoc.embedFont(fontBytes, { subset: false })

  // Step 4: Use the font
  const page = pdfDoc.addPage()
  page.drawText('PDF 動態浮水印功能', {
    x: 50,
    y: 700,
    size: 24,
    font: cjkFont,
    color: rgb(0, 0, 0),
  })

  return pdfDoc.save()
}
```

### CJK Subsetting Issue

**Problem**: `@pdf-lib/fontkit` has a bug where `subset: true` causes many CJK characters to disappear from the output PDF. The subsetting algorithm does not correctly handle the complex glyph mappings in CJK fonts.

**Solutions** (choose one):

| Approach | Pros | Cons |
|---|---|---|
| `subset: false` | All glyphs preserved, simple | Large PDF (CJK fonts are 10-20MB) |
| Replace with `pdf-fontkit` | Correct subsetting, smaller files | Different npm package |

```bash
# Option A: Just use subset: false (simpler)
# No package change needed

# Option B: Replace fontkit for proper CJK subsetting
npm uninstall @pdf-lib/fontkit
npm install pdf-fontkit
```

```typescript
// Option B usage
import fontkit from 'pdf-fontkit'  // drop-in replacement

pdfDoc.registerFontkit(fontkit)
const cjkFont = await pdfDoc.embedFont(fontBytes, { subset: true }) // now works for CJK
```

### Recommended CJK Fonts

- **Noto Sans CJK** (Google): `NotoSansCJKtc-Regular.ttf` (Traditional Chinese), `NotoSansCJKsc-Regular.ttf` (Simplified Chinese), `NotoSansCJKjp-Regular.ttf` (Japanese), `NotoSansCJKkr-Regular.ttf` (Korean)
- **Noto Serif CJK**: Serif variants of the above
- Format: TTF preferred (OTF also works)

---

## Watermark Patterns

### Text Watermark (diagonal, semi-transparent)

```typescript
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'

async function addTextWatermark(
  pdfBytes: ArrayBuffer,
  watermarkText: string,
  options?: {
    fontSize?: number
    opacity?: number
    angle?: number
    color?: { r: number; g: number; b: number }
  }
) {
  const { fontSize = 60, opacity = 0.2, angle = -45, color = { r: 0.5, g: 0.5, b: 0.5 } } = options ?? {}

  const pdfDoc = await PDFDocument.load(pdfBytes)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const pages = pdfDoc.getPages()

  for (const page of pages) {
    const { width, height } = page.getSize()
    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize)

    page.drawText(watermarkText, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      rotate: degrees(angle),
      opacity,
    })
  }

  return pdfDoc.save()
}
```

### CJK Text Watermark

```typescript
import { PDFDocument, rgb, degrees } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import fs from 'fs'

async function addCJKWatermark(pdfBytes: ArrayBuffer, text: string) {
  const pdfDoc = await PDFDocument.load(pdfBytes)

  pdfDoc.registerFontkit(fontkit)
  const fontBytes = fs.readFileSync('path/to/NotoSansCJKtc-Regular.ttf')
  const cjkFont = await pdfDoc.embedFont(fontBytes, { subset: false })

  const pages = pdfDoc.getPages()
  for (const page of pages) {
    const { width, height } = page.getSize()
    const textWidth = cjkFont.widthOfTextAtSize(text, 48)

    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: 48,
      font: cjkFont,
      color: rgb(0.7, 0.7, 0.7),
      rotate: degrees(-45),
      opacity: 0.15,
    })
  }

  return pdfDoc.save()
}
```

### Tiled Watermark (repeating pattern)

```typescript
async function addTiledWatermark(pdfBytes: ArrayBuffer, text: string) {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontSize = 30
  const pages = pdfDoc.getPages()

  for (const page of pages) {
    const { width, height } = page.getSize()

    // Tile across the page
    for (let y = 50; y < height; y += 150) {
      for (let x = -100; x < width + 100; x += 250) {
        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.85, 0.85, 0.85),
          rotate: degrees(-30),
          opacity: 0.15,
        })
      }
    }
  }

  return pdfDoc.save()
}
```

### Image Watermark

```typescript
async function addImageWatermark(
  pdfBytes: ArrayBuffer,
  watermarkImageBytes: ArrayBuffer,
  imageType: 'png' | 'jpg' = 'png'
) {
  const pdfDoc = await PDFDocument.load(pdfBytes)

  const image = imageType === 'png'
    ? await pdfDoc.embedPng(watermarkImageBytes)
    : await pdfDoc.embedJpg(watermarkImageBytes)

  const pages = pdfDoc.getPages()
  for (const page of pages) {
    const { width, height } = page.getSize()
    const dims = image.scaleToFit(width * 0.3, height * 0.3)

    page.drawImage(image, {
      x: width / 2 - dims.width / 2,
      y: height / 2 - dims.height / 2,
      width: dims.width,
      height: dims.height,
      opacity: 0.15,
    })
  }

  return pdfDoc.save()
}
```

---

## Table Drawing

pdf-lib has no built-in table API. Tables are drawn manually using `drawText`, `drawLine`, and `drawRectangle`. For complex tables, consider the community package `pdf-lib-draw-table`.

### Simple Table Pattern

```typescript
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

interface TableCell {
  text: string
  width: number
}

async function drawTable(
  page: import('pdf-lib').PDFPage,
  font: import('pdf-lib').PDFFont,
  startX: number,
  startY: number,
  headers: TableCell[],
  rows: string[][],
  options?: {
    fontSize?: number
    rowHeight?: number
    headerBg?: import('pdf-lib').Color
    borderColor?: import('pdf-lib').Color
    padding?: number
  }
) {
  const {
    fontSize = 10,
    rowHeight = 25,
    headerBg = rgb(0.9, 0.9, 0.9),
    borderColor = rgb(0, 0, 0),
    padding = 5,
  } = options ?? {}

  const totalWidth = headers.reduce((sum, h) => sum + h.width, 0)
  const totalRows = rows.length + 1 // +1 for header

  // Draw header background
  page.drawRectangle({
    x: startX,
    y: startY - rowHeight,
    width: totalWidth,
    height: rowHeight,
    color: headerBg,
    borderColor,
    borderWidth: 0.5,
  })

  // Draw header text
  let xOffset = startX
  for (const header of headers) {
    page.drawText(header.text, {
      x: xOffset + padding,
      y: startY - rowHeight + (rowHeight - fontSize) / 2,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
    xOffset += header.width
  }

  // Draw data rows
  for (let r = 0; r < rows.length; r++) {
    const rowY = startY - (r + 2) * rowHeight

    // Row border
    page.drawRectangle({
      x: startX,
      y: rowY,
      width: totalWidth,
      height: rowHeight,
      borderColor,
      borderWidth: 0.5,
    })

    // Cell text
    xOffset = startX
    for (let c = 0; c < rows[r].length; c++) {
      page.drawText(rows[r][c], {
        x: xOffset + padding,
        y: rowY + (rowHeight - fontSize) / 2,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
      xOffset += headers[c].width
    }
  }

  // Draw vertical column separators
  xOffset = startX
  for (let c = 0; c <= headers.length; c++) {
    page.drawLine({
      start: { x: xOffset, y: startY },
      end: { x: xOffset, y: startY - totalRows * rowHeight },
      thickness: 0.5,
      color: borderColor,
    })
    if (c < headers.length) xOffset += headers[c].width
  }
}
```

### Usage

```typescript
const pdfDoc = await PDFDocument.create()
const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
const page = pdfDoc.addPage()

await drawTable(page, font, 50, 700, [
  { text: 'Name', width: 150 },
  { text: 'Email', width: 200 },
  { text: 'Role', width: 100 },
], [
  ['Alice', 'alice@example.com', 'Admin'],
  ['Bob', 'bob@example.com', 'User'],
  ['Charlie', 'charlie@example.com', 'Editor'],
])
```

---

## Header & Footer Patterns

### Page Number Footer

```typescript
async function addPageNumbers(pdfBytes: ArrayBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const pages = pdfDoc.getPages()
  const totalPages = pages.length

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const { width } = page.getSize()
    const text = `Page ${i + 1} of ${totalPages}`
    const textWidth = font.widthOfTextAtSize(text, 10)

    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: 20,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    })
  }

  return pdfDoc.save()
}
```

### Header with Logo

```typescript
async function addHeader(
  pdfBytes: ArrayBuffer,
  logoBytes: ArrayBuffer,
  headerText: string
) {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const logo = await pdfDoc.embedPng(logoBytes)
  const logoDims = logo.scaleToFit(40, 40)
  const pages = pdfDoc.getPages()

  for (const page of pages) {
    const { width, height } = page.getSize()

    // Logo (top-left)
    page.drawImage(logo, {
      x: 30,
      y: height - 50,
      width: logoDims.width,
      height: logoDims.height,
    })

    // Header text (next to logo)
    page.drawText(headerText, {
      x: 30 + logoDims.width + 10,
      y: height - 40,
      size: 14,
      font,
      color: rgb(0.2, 0.2, 0.2),
    })

    // Separator line
    page.drawLine({
      start: { x: 30, y: height - 55 },
      end: { x: width - 30, y: height - 55 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })
  }

  return pdfDoc.save()
}
```

---

## Coordinate System Tips

### Converting from top-left origin

Many UI frameworks use top-left origin. To convert:

```typescript
function topLeftToBottomLeft(
  topY: number,
  pageHeight: number
): number {
  return pageHeight - topY
}

// Position text 100pt from the top of a Letter page:
const y = topLeftToBottomLeft(100, 792) // = 692
```

### Common page sizes (points)

| Size | Width | Height |
|---|---|---|
| US Letter | 612 | 792 |
| A4 | 595.28 | 841.89 |
| A3 | 841.89 | 1190.55 |
| Legal | 612 | 1008 |
| Tabloid | 792 | 1224 |

### Text positioning

Text is positioned from the baseline (bottom of text, excluding descenders). To place text N points from the top of the page:

```typescript
const { height } = page.getSize()
const fontSize = 24
const textHeight = font.heightAtSize(fontSize)

// N points from top edge
page.drawText('Hello', {
  x: margin,
  y: height - margin - textHeight,
  size: fontSize,
  font,
})
```

---

## PDF Merging Strategies

### Merge all pages from multiple PDFs

```typescript
async function mergePdfs(pdfBytesList: ArrayBuffer[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create()

  for (const pdfBytes of pdfBytesList) {
    const pdf = await PDFDocument.load(pdfBytes)
    const pages = await merged.copyPages(pdf, pdf.getPageIndices())
    pages.forEach(page => merged.addPage(page))
  }

  return merged.save()
}
```

### Extract specific pages

```typescript
async function extractPages(
  pdfBytes: ArrayBuffer,
  pageIndices: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes)
  const newDoc = await PDFDocument.create()

  const pages = await newDoc.copyPages(srcDoc, pageIndices)
  pages.forEach(page => newDoc.addPage(page))

  return newDoc.save()
}

// Usage: extract pages 0, 2, 5
const result = await extractPages(pdfBytes, [0, 2, 5])
```

### Split PDF into single-page files

```typescript
async function splitPdf(pdfBytes: ArrayBuffer): Promise<Uint8Array[]> {
  const srcDoc = await PDFDocument.load(pdfBytes)
  const results: Uint8Array[] = []

  for (let i = 0; i < srcDoc.getPageCount(); i++) {
    const newDoc = await PDFDocument.create()
    const [page] = await newDoc.copyPages(srcDoc, [i])
    newDoc.addPage(page)
    results.push(await newDoc.save())
  }

  return results
}
```

---

## Form Handling Patterns

### List all form field names (for discovery)

```typescript
async function listFormFields(pdfBytes: ArrayBuffer) {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const form = pdfDoc.getForm()
  const fields = form.getFields()

  return fields.map(field => ({
    name: field.getName(),
    type: field.constructor.name,
  }))
}
```

### Fill form and flatten (for final output)

```typescript
async function fillAndFlatten(
  pdfBytes: ArrayBuffer,
  fieldValues: Record<string, string>
) {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const form = pdfDoc.getForm()

  for (const [fieldName, value] of Object.entries(fieldValues)) {
    try {
      const field = form.getTextField(fieldName)
      field.setText(value)
    } catch {
      // Field not found or not a text field - skip
    }
  }

  form.flatten()
  return pdfDoc.save()
}
```

---

## Performance & File Size

### Reducing file size

1. **Font subsetting** (for non-CJK fonts):
   ```typescript
   await pdfDoc.embedFont(fontBytes, { subset: true })
   ```

2. **Object stream compression**:
   ```typescript
   await pdfDoc.save({ useObjectStreams: true })
   ```

3. **Image optimization**: Resize/compress images before embedding. pdf-lib does not do image optimization.

4. **Avoid embedding the same font/image multiple times**. Embed once, reuse the PDFFont/PDFImage reference.

### Memory considerations

- CJK fonts can be 10-20MB in memory
- Large PDFs (1000+ pages) may cause memory issues in browser
- Use `objectsPerTick` in save options to reduce memory spikes:
  ```typescript
  await pdfDoc.save({ objectsPerTick: 50 })
  ```

---

## Browser vs Node.js Differences

### Reading files

```typescript
// Node.js
import fs from 'fs'
const pdfBytes = fs.readFileSync('document.pdf')

// Browser (from <input type="file">)
const file = inputElement.files[0]
const pdfBytes = await file.arrayBuffer()

// Browser (from URL)
const pdfBytes = await fetch(url).then(res => res.arrayBuffer())
```

### Saving/downloading

```typescript
// Node.js
const pdfBytes = await pdfDoc.save()
fs.writeFileSync('output.pdf', pdfBytes)

// Browser - trigger download
const pdfBytes = await pdfDoc.save()
const blob = new Blob([pdfBytes], { type: 'application/pdf' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'output.pdf'
a.click()
URL.revokeObjectURL(url)

// Browser - display in iframe
const dataUri = await pdfDoc.saveAsBase64({ dataUri: true })
document.getElementById('pdf-iframe').src = dataUri
```

---

## Common Errors & Solutions

### "Input document to PDFDocument.load is encrypted"

The PDF is password-protected. pdf-lib has limited encryption support.

```typescript
// Attempt to load (may not work for all encrypted PDFs)
const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
```

### "Cannot embed font. No fontkit instance registered"

You are trying to embed a custom font without registering fontkit.

```typescript
import fontkit from '@pdf-lib/fontkit'
pdfDoc.registerFontkit(fontkit) // Must call BEFORE embedFont
```

### "No glyph for character"

The embedded font does not contain the glyph for the character you are trying to render. Common with CJK characters and standard fonts.

**Solution**: Embed a font that includes the required glyphs (e.g., Noto Sans CJK for Chinese/Japanese/Korean).

### "Cannot read properties of undefined"

Often caused by accessing a page that does not exist.

```typescript
// Wrong: pages are 0-indexed
const page = pdfDoc.getPage(pdfDoc.getPageCount()) // out of bounds!

// Correct
const page = pdfDoc.getPage(pdfDoc.getPageCount() - 1)
```

### Form field not found

Field names in PDF forms can be unexpected. Always discover field names first.

```typescript
const form = pdfDoc.getForm()
const fields = form.getFields()
fields.forEach(f => console.log(f.getName(), f.constructor.name))
```

---

## TypeScript Type Imports

```typescript
import {
  // Core classes
  PDFDocument,
  PDFPage,
  PDFFont,
  PDFImage,
  PDFEmbeddedPage,
  PDFForm,

  // Field classes
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
  PDFDropdown,
  PDFOptionList,
  PDFButton,
  PDFField,

  // Helpers
  rgb,
  cmyk,
  grayscale,
  degrees,
  radians,

  // Enums
  StandardFonts,
  BlendMode,
  TextAlignment,
  LineCapStyle,
  ParseSpeeds,
  RotationTypes,

  // Types (used as type-only imports with `import type`)
  // Color, Rotation, PDFPageDrawTextOptions, etc.
} from 'pdf-lib'

// Type-only imports for interfaces
import type {
  Color,
  Rotation,
  PDFPageDrawTextOptions,
  PDFPageDrawImageOptions,
  PDFPageDrawRectangleOptions,
  PDFPageDrawLineOptions,
  SaveOptions,
  LoadOptions,
} from 'pdf-lib'
```
