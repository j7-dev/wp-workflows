# pdf-lib API Reference

> Complete API reference for pdf-lib v1.17.1. Source: https://pdf-lib.js.org/docs/api/

## Table of Contents

- [PDFDocument](#pdfdocument)
- [PDFPage](#pdfpage)
- [PDFFont](#pdffont)
- [PDFImage](#pdfimage)
- [PDFEmbeddedPage](#pdfembeddedpage)
- [PDFForm](#pdfform)
- [PDFField (base class)](#pdffield)
- [PDFTextField](#pdftextfield)
- [PDFCheckBox](#pdfcheckbox)
- [PDFRadioGroup](#pdfradiogroup)
- [PDFDropdown](#pdfdropdown)
- [PDFOptionList](#pdfoptionlist)
- [PDFButton](#pdfbutton)
- [Draw Options Interfaces](#draw-options-interfaces)
- [Enums](#enums)
- [Color & Rotation Helpers](#color--rotation-helpers)
- [Options Interfaces](#options-interfaces)

---

## PDFDocument

Source: https://pdf-lib.js.org/docs/api/classes/pdfdocument

### Properties

| Property | Type | Description |
|---|---|---|
| `catalog` | PDFCatalog | Document catalog structure |
| `context` | PDFContext | Low-level document context |
| `defaultWordBreaks` | string[] | Default word break characters (default: `[' ']`) |
| `isEncrypted` | boolean | Whether the document is encrypted |

### Static Methods

#### `PDFDocument.create(options?: CreateOptions): Promise<PDFDocument>`
Creates a new empty PDF document.
- `options.updateMetadata?: boolean` - Whether to set default metadata

#### `PDFDocument.load(pdf, options?: LoadOptions): Promise<PDFDocument>`
Loads an existing PDF document.
- `pdf: string | Uint8Array | ArrayBuffer` - PDF data (base64, data URI, or raw bytes)
- `options.ignoreEncryption?: boolean` - Bypass encryption checks
- `options.parseSpeed?: ParseSpeeds | number` - Parsing speed (default: Medium)
- `options.throwOnInvalidObject?: boolean` - Throw on malformed objects
- `options.updateMetadata?: boolean` - Update metadata on load
- `options.capNumbers?: boolean` - Cap number values

### Page Management

| Method | Signature | Description |
|---|---|---|
| `addPage` | `(page?: PDFPage \| [number, number]): PDFPage` | Append page. Pass `[w, h]` for custom size |
| `insertPage` | `(index: number, page?: PDFPage \| [number, number]): PDFPage` | Insert at index |
| `removePage` | `(index: number): void` | Remove page at index |
| `getPage` | `(index: number): PDFPage` | Get page by index |
| `getPages` | `(): PDFPage[]` | Get all pages |
| `getPageCount` | `(): number` | Total page count |
| `getPageIndices` | `(): number[]` | Array of valid indices |

### Page Copying & Embedding

| Method | Signature | Description |
|---|---|---|
| `copyPages` | `(srcDoc: PDFDocument, indices: number[]): Promise<PDFPage[]>` | Copy pages from another doc (for merging) |
| `embedPdf` | `(pdf: string \| Uint8Array \| ArrayBuffer \| PDFDocument, indices?: number[]): Promise<PDFEmbeddedPage[]>` | Embed PDF pages as visual elements |
| `embedPage` | `(page: PDFPage, boundingBox?, transformationMatrix?): Promise<PDFEmbeddedPage>` | Embed single page with optional crop |
| `embedPages` | `(pages: PDFPage[], boundingBoxes?, transformationMatrices?): Promise<PDFEmbeddedPage[]>` | Embed multiple pages |

**embedPage boundingBox**: `{ left: number, bottom: number, right: number, top: number }`

### Font & Image Embedding

| Method | Signature | Description |
|---|---|---|
| `embedFont` | `(font: StandardFonts \| string \| Uint8Array \| ArrayBuffer, options?: EmbedFontOptions): Promise<PDFFont>` | Embed font (standard or custom bytes) |
| `embedStandardFont` | `(font: StandardFonts, customName?: string): PDFFont` | Embed standard font (synchronous) |
| `embedJpg` | `(jpg: string \| Uint8Array \| ArrayBuffer): Promise<PDFImage>` | Embed JPEG image |
| `embedPng` | `(png: string \| Uint8Array \| ArrayBuffer): Promise<PDFImage>` | Embed PNG image |
| `registerFontkit` | `(fontkit: Fontkit): void` | Register fontkit for custom font support |

**EmbedFontOptions**:
- `subset?: boolean` - Enable font subsetting (WARNING: broken for CJK in `@pdf-lib/fontkit`)
- `customName?: string` - Custom name for the font
- `features?: TypeFeatures` - OpenType font features

### Metadata

| Method | Signature |
|---|---|
| `setTitle` | `(title: string, options?: { showInWindowTitleBar?: boolean }): void` |
| `setAuthor` | `(author: string): void` |
| `setSubject` | `(subject: string): void` |
| `setKeywords` | `(keywords: string[]): void` |
| `setCreator` | `(creator: string): void` |
| `setProducer` | `(producer: string): void` |
| `setCreationDate` | `(date: Date): void` |
| `setModificationDate` | `(date: Date): void` |
| `setLanguage` | `(language: string): void` |
| `getTitle` | `(): string \| undefined` |
| `getAuthor` | `(): string \| undefined` |
| `getSubject` | `(): string \| undefined` |
| `getKeywords` | `(): string \| undefined` |
| `getCreator` | `(): string \| undefined` |
| `getProducer` | `(): string \| undefined` |
| `getCreationDate` | `(): Date \| undefined` |
| `getModificationDate` | `(): Date \| undefined` |

### Form & Content

| Method | Signature | Description |
|---|---|---|
| `getForm` | `(): PDFForm` | Get interactive form |
| `attach` | `(attachment: string \| Uint8Array \| ArrayBuffer, name: string, options?: AttachmentOptions): Promise<void>` | Add file attachment |
| `addJavaScript` | `(name: string, script: string): void` | Embed JavaScript |

**AttachmentOptions**:
- `mimeType?: string`
- `description?: string`
- `creationDate?: Date`
- `modificationDate?: Date`

### Save & Serialize

| Method | Signature | Description |
|---|---|---|
| `save` | `(options?: SaveOptions): Promise<Uint8Array>` | Serialize to PDF bytes |
| `saveAsBase64` | `(options?: Base64SaveOptions): Promise<string>` | Serialize to base64 |
| `copy` | `(): Promise<PDFDocument>` | Create document copy |
| `flush` | `(): Promise<void>` | Flush embedded assets |

**SaveOptions**:
- `useObjectStreams?: boolean` - Enable compression
- `addDefaultPage?: boolean` - Add blank page if empty
- `objectsPerTick?: number` - Processing batch size
- `updateFieldAppearances?: boolean` - Refresh form appearances

**Base64SaveOptions** extends SaveOptions:
- `dataUri?: boolean` - Return as data URI string

---

## PDFPage

Source: https://pdf-lib.js.org/docs/api/classes/pdfpage

### Properties

| Property | Type | Description |
|---|---|---|
| `doc` | PDFDocument | Parent document |
| `node` | PDFPageLeaf | Low-level dictionary |
| `ref` | PDFRef | Unique reference |

### Drawing Methods

#### `drawText(text: string, options?: PDFPageDrawTextOptions): void`
Draw text on the page. See [PDFPageDrawTextOptions](#pdfpagedrawtextoptions).

#### `drawImage(image: PDFImage, options?: PDFPageDrawImageOptions): void`
Draw an embedded image. See [PDFPageDrawImageOptions](#pdfpagedrawimageoptions).

#### `drawRectangle(options?: PDFPageDrawRectangleOptions): void`
Draw a rectangle with optional fill and border.

#### `drawSquare(options?: PDFPageDrawSquareOptions): void`
Draw a square.

#### `drawLine(options: PDFPageDrawLineOptions): void`
Draw a line between two points.

#### `drawCircle(options?: PDFPageDrawCircleOptions): void`
Draw a circle.

#### `drawEllipse(options?: PDFPageDrawEllipseOptions): void`
Draw an ellipse.

#### `drawSvgPath(path: string, options?: PDFPageDrawSVGOptions): void`
Render an SVG path string.

#### `drawPage(embeddedPage: PDFEmbeddedPage, options?: PDFPageDrawPageOptions): void`
Draw an embedded PDF page.

### Size & Dimension Methods

| Method | Signature | Description |
|---|---|---|
| `getSize` | `(): { width: number; height: number }` | Page dimensions |
| `setSize` | `(width: number, height: number): void` | Resize page |
| `getWidth` | `(): number` | Page width |
| `setWidth` | `(width: number): void` | Set width only |
| `getHeight` | `(): number` | Page height |
| `setHeight` | `(height: number): void` | Set height only |

### Box Methods (MediaBox, CropBox, etc.)

| Method | Signature |
|---|---|
| `getMediaBox` / `setMediaBox` | `(): { x, y, width, height }` / `(x, y, w, h): void` |
| `getCropBox` / `setCropBox` | Same pattern (defaults to MediaBox) |
| `getBleedBox` / `setBleedBox` | Same pattern (defaults to CropBox) |
| `getTrimBox` / `setTrimBox` | Same pattern (defaults to CropBox) |
| `getArtBox` / `setArtBox` | Same pattern (defaults to CropBox) |

### Position & Movement

| Method | Signature | Description |
|---|---|---|
| `getPosition` | `(): { x: number; y: number }` | Current default position |
| `getX` / `getY` | `(): number` | Individual coordinates |
| `moveTo` | `(x: number, y: number): void` | Set default position |
| `moveUp` | `(yIncrease: number): void` | Increase Y |
| `moveDown` | `(yDecrease: number): void` | Decrease Y |
| `moveRight` | `(xIncrease: number): void` | Increase X |
| `moveLeft` | `(xDecrease: number): void` | Decrease X |
| `resetPosition` | `(): void` | Reset to (0, 0) |

### Text Formatting Defaults

| Method | Signature | Description |
|---|---|---|
| `setFont` | `(font: PDFFont): void` | Default font |
| `setFontSize` | `(fontSize: number): void` | Default font size |
| `setFontColor` | `(fontColor: Color): void` | Default text color |
| `setLineHeight` | `(lineHeight: number): void` | Default line spacing |

### Rotation & Transformation

| Method | Signature | Description |
|---|---|---|
| `getRotation` | `(): Rotation` | Page rotation (0, 90, 180, 270) |
| `setRotation` | `(angle: Rotation): void` | Set page rotation |
| `translateContent` | `(x: number, y: number): void` | Shift all content |
| `scale` | `(x: number, y: number): void` | Scale page size + content + annotations |
| `scaleContent` | `(x: number, y: number): void` | Scale content only |
| `scaleAnnotations` | `(x: number, y: number): void` | Scale annotations only |

### Advanced

| Method | Signature |
|---|---|
| `pushOperators` | `(...operator: PDFOperator[]): void` |

---

## PDFFont

Source: https://pdf-lib.js.org/docs/api/classes/pdffont

### Properties

| Property | Type |
|---|---|
| `doc` | PDFDocument |
| `name` | string |
| `ref` | PDFRef |

### Methods

| Method | Signature | Description |
|---|---|---|
| `widthOfTextAtSize` | `(text: string, size: number): number` | Measure text width in points |
| `heightAtSize` | `(size: number, options?: { descender?: boolean }): number` | Font height at size |
| `sizeAtHeight` | `(height: number): number` | Font size needed for height |
| `encodeText` | `(text: string): PDFHexString` | Encode text for PDF |
| `getCharacterSet` | `(): number[]` | Unicode code points supported |
| `embed` | `(): Promise<void>` | Called automatically by save() |

---

## PDFImage

Source: https://pdf-lib.js.org/docs/api/classes/pdfimage

### Properties

| Property | Type |
|---|---|
| `doc` | PDFDocument |
| `width` | number (pixels) |
| `height` | number (pixels) |
| `ref` | PDFRef |

### Methods

| Method | Signature | Description |
|---|---|---|
| `scale` | `(factor: number): { width: number; height: number }` | Scale dimensions by factor |
| `scaleToFit` | `(width: number, height: number): { width: number; height: number }` | Fit within bounds proportionally |
| `size` | `(): { width: number; height: number }` | Current dimensions |
| `embed` | `(): Promise<void>` | Called automatically by save() |

---

## PDFEmbeddedPage

Source: https://pdf-lib.js.org/docs/api/classes/pdfembeddedpage

### Properties

| Property | Type |
|---|---|
| `doc` | PDFDocument |
| `width` | number |
| `height` | number |
| `ref` | PDFRef |

### Methods

| Method | Signature | Description |
|---|---|---|
| `scale` | `(factor: number): { width: number; height: number }` | Scale dimensions |
| `size` | `(): { width: number; height: number }` | Current dimensions |
| `embed` | `(): Promise<void>` | Called automatically by save() |

---

## PDFForm

Source: https://pdf-lib.js.org/docs/api/classes/pdfform

### Properties

| Property | Type |
|---|---|
| `acroForm` | PDFAcroForm |
| `doc` | PDFDocument |

### Field Retrieval

| Method | Signature | Description |
|---|---|---|
| `getField` | `(name: string): PDFField` | Get field (throws if not found) |
| `getFieldMaybe` | `(name: string): PDFField \| undefined` | Get field or undefined |
| `getFields` | `(): PDFField[]` | All fields |
| `getTextField` | `(name: string): PDFTextField` | Throws if wrong type |
| `getCheckBox` | `(name: string): PDFCheckBox` | Throws if wrong type |
| `getRadioGroup` | `(name: string): PDFRadioGroup` | Throws if wrong type |
| `getDropdown` | `(name: string): PDFDropdown` | Throws if wrong type |
| `getOptionList` | `(name: string): PDFOptionList` | Throws if wrong type |
| `getButton` | `(name: string): PDFButton` | Throws if wrong type |
| `getSignature` | `(name: string): PDFSignature` | Throws if wrong type |
| `getDefaultFont` | `(): PDFFont` | Form default font |

### Field Creation

| Method | Signature | Description |
|---|---|---|
| `createTextField` | `(name: string): PDFTextField` | Throws if name exists |
| `createCheckBox` | `(name: string): PDFCheckBox` | Throws if name exists |
| `createRadioGroup` | `(name: string): PDFRadioGroup` | Throws if name exists |
| `createDropdown` | `(name: string): PDFDropdown` | Throws if name exists |
| `createOptionList` | `(name: string): PDFOptionList` | Throws if name exists |
| `createButton` | `(name: string): PDFButton` | Throws if name exists |

### Form Management

| Method | Signature | Description |
|---|---|---|
| `flatten` | `(options?: FlattenOptions): void` | Convert fields to static content |
| `removeField` | `(field: PDFField): void` | Remove a field |
| `updateFieldAppearances` | `(font?: PDFFont): void` | Update all field appearances |
| `markFieldAsDirty` | `(fieldRef: PDFRef): void` | Mark for appearance update |
| `markFieldAsClean` | `(fieldRef: PDFRef): void` | Skip appearance update |
| `fieldIsDirty` | `(fieldRef: PDFRef): boolean` | Check dirty status |
| `hasXFA` | `(): boolean` | Check for XFA data |
| `deleteXFA` | `(): void` | Remove XFA data |

---

## PDFField

Base class for all form fields. Source: https://pdf-lib.js.org/docs/api/classes/pdffield

### Properties

| Property | Type |
|---|---|
| `acroField` | PDFAcroTerminal |
| `doc` | PDFDocument |
| `ref` | PDFRef |

### Methods

| Method | Signature |
|---|---|
| `getName` | `(): string` |
| `isReadOnly` / `enableReadOnly` / `disableReadOnly` | `(): boolean` / `(): void` |
| `isRequired` / `enableRequired` / `disableRequired` | `(): boolean` / `(): void` |
| `isExported` / `enableExporting` / `disableExporting` | `(): boolean` / `(): void` |

---

## PDFTextField

Source: https://pdf-lib.js.org/docs/api/classes/pdftextfield

### Core Methods

| Method | Signature | Description |
|---|---|---|
| `setText` | `(text: string \| undefined): void` | Set field text |
| `getText` | `(): string \| undefined` | Get field text |
| `setImage` | `(image: PDFImage): void` | Display image in field |
| `setAlignment` | `(alignment: TextAlignment): void` | Left, Center, Right |
| `getAlignment` | `(): TextAlignment` | Current alignment |
| `setFontSize` | `(fontSize: number): void` | Set font size |
| `setMaxLength` | `(maxLength?: number): void` | Character limit |
| `getMaxLength` | `(): number \| undefined` | Get character limit |
| `removeMaxLength` | `(): void` | Remove limit |
| `addToPage` | `(page: PDFPage, options?: FieldAppearanceOptions): void` | Add widget to page |

### Mode Toggles

| Feature | Enable | Disable | Query |
|---|---|---|---|
| Multiline | `enableMultiline()` | `disableMultiline()` | `isMultiline()` |
| Scrolling | `enableScrolling()` | `disableScrolling()` | `isScrollable()` |
| Combing | `enableCombing()` | `disableCombing()` | `isCombed()` |
| Rich text | `enableRichFormatting()` | `disableRichFormatting()` | `isRichFormatted()` |
| Password | `enablePassword()` | `disablePassword()` | `isPassword()` |
| File select | `enableFileSelection()` | `disableFileSelection()` | `isFileSelector()` |
| Spell check | `enableSpellChecking()` | `disableSpellChecking()` | `isSpellChecked()` |

---

## PDFCheckBox

Source: https://pdf-lib.js.org/docs/api/classes/pdfcheckbox

| Method | Signature | Description |
|---|---|---|
| `check` | `(): void` | Mark checkbox |
| `uncheck` | `(): void` | Clear checkbox |
| `isChecked` | `(): boolean` | Query state |
| `addToPage` | `(page: PDFPage, options?: FieldAppearanceOptions): void` | Add widget |

---

## PDFRadioGroup

Source: https://pdf-lib.js.org/docs/api/classes/pdfradiogroup

| Method | Signature | Description |
|---|---|---|
| `select` | `(option: string): void` | Select an option |
| `getSelected` | `(): string \| undefined` | Currently selected |
| `getOptions` | `(): string[]` | All available options |
| `clear` | `(): void` | Deselect all |
| `addOptionToPage` | `(option: string, page: PDFPage, options?: FieldAppearanceOptions): void` | Add radio button |
| `enableOffToggling` / `disableOffToggling` | `(): void` | Toggle off capability |
| `enableMutualExclusion` / `disableMutualExclusion` | `(): void` | Same-value exclusion |
| `isMutuallyExclusive` / `isOffToggleable` | `(): boolean` | Query state |

---

## PDFDropdown

Source: https://pdf-lib.js.org/docs/api/classes/pdfdropdown

| Method | Signature | Description |
|---|---|---|
| `setOptions` | `(options: string[]): void` | Replace all options |
| `addOptions` | `(options: string \| string[]): void` | Append options |
| `getOptions` | `(): string[]` | All options |
| `select` | `(options: string \| string[], merge?: boolean): void` | Select value(s) |
| `getSelected` | `(): string[]` | Selected values |
| `clear` | `(): void` | Deselect all |
| `addToPage` | `(page: PDFPage, options?: FieldAppearanceOptions): void` | Add widget |
| `setFontSize` | `(fontSize: number): void` | Text size |

### Mode Toggles

| Feature | Enable | Disable | Query |
|---|---|---|---|
| Editing | `enableEditing()` | `disableEditing()` | `isEditable()` |
| Multiselect | `enableMultiselect()` | `disableMultiselect()` | `isMultiselect()` |
| Sorting | `enableSorting()` | `disableSorting()` | `isSorted()` |
| Spell check | `enableSpellChecking()` | `disableSpellChecking()` | `isSpellChecked()` |
| Select on click | `enableSelectOnClick()` | `disableSelectOnClick()` | `isSelectOnClick()` |

---

## PDFOptionList

Source: https://pdf-lib.js.org/docs/api/classes/pdfoptionlist

| Method | Signature | Description |
|---|---|---|
| `setOptions` | `(options: string[]): void` | Replace all options |
| `addOptions` | `(options: string \| string[]): void` | Append options |
| `getOptions` | `(): string[]` | All options |
| `select` | `(options: string \| string[], merge?: boolean): void` | Select value(s) |
| `getSelected` | `(): string[]` | Selected values |
| `clear` | `(): void` | Deselect all |
| `addToPage` | `(page: PDFPage, options?: FieldAppearanceOptions): void` | Add widget |
| `setFontSize` | `(fontSize: number): void` | Text size |

Mode toggles: `enableMultiselect/disableMultiselect`, `enableSorting/disableSorting`, `enableSelectOnClick/disableSelectOnClick`

---

## PDFButton

Source: https://pdf-lib.js.org/docs/api/classes/pdfbutton

| Method | Signature | Description |
|---|---|---|
| `setImage` | `(image: PDFImage, alignment?: ImageAlignment): void` | Set button image |
| `addToPage` | `(text: string, page: PDFPage, options?: FieldAppearanceOptions): void` | Add button with text |
| `setFontSize` | `(fontSize: number): void` | Button text size |

---

## Draw Options Interfaces

### PDFPageDrawTextOptions

| Property | Type | Description |
|---|---|---|
| `x?` | number | Horizontal position |
| `y?` | number | Vertical position |
| `font?` | PDFFont | Font to use |
| `size?` | number | Font size in points |
| `color?` | Color | Text color |
| `opacity?` | number | 0-1 transparency |
| `rotate?` | Rotation | Rotation angle |
| `lineHeight?` | number | Line spacing |
| `maxWidth?` | number | Wrap width |
| `wordBreaks?` | string[] | Break characters |
| `blendMode?` | BlendMode | Blend mode |
| `xSkew?` | Rotation | Horizontal skew |
| `ySkew?` | Rotation | Vertical skew |

### PDFPageDrawImageOptions

| Property | Type |
|---|---|
| `x?` | number |
| `y?` | number |
| `width?` | number |
| `height?` | number |
| `rotate?` | Rotation |
| `xSkew?` | Rotation |
| `ySkew?` | Rotation |
| `opacity?` | number |
| `blendMode?` | BlendMode |

### PDFPageDrawRectangleOptions

| Property | Type |
|---|---|
| `x?` | number |
| `y?` | number |
| `width?` | number |
| `height?` | number |
| `rotate?` | Rotation |
| `xSkew?` | Rotation |
| `ySkew?` | Rotation |
| `color?` | Color (fill) |
| `opacity?` | number (fill) |
| `borderColor?` | Color |
| `borderOpacity?` | number |
| `borderWidth?` | number |
| `borderDashArray?` | number[] |
| `borderDashPhase?` | number |
| `borderLineCap?` | LineCapStyle |
| `blendMode?` | BlendMode |

### PDFPageDrawSquareOptions

Same as Rectangle but uses `size?: number` instead of `width`/`height`.

### PDFPageDrawLineOptions

| Property | Type | Required |
|---|---|---|
| `start` | `{ x: number; y: number }` | Yes |
| `end` | `{ x: number; y: number }` | Yes |
| `thickness?` | number | No |
| `color?` | Color | No |
| `opacity?` | number | No |
| `lineCap?` | LineCapStyle | No |
| `dashArray?` | number[] | No |
| `dashPhase?` | number | No |
| `blendMode?` | BlendMode | No |

### PDFPageDrawCircleOptions

| Property | Type |
|---|---|
| `x?` | number |
| `y?` | number |
| `size?` | number |
| `color?` | Color |
| `opacity?` | number |
| `borderColor?` | Color |
| `borderOpacity?` | number |
| `borderWidth?` | number |
| `borderDashArray?` | number[] |
| `borderDashPhase?` | number |
| `borderLineCap?` | LineCapStyle |
| `blendMode?` | BlendMode |

### PDFPageDrawEllipseOptions

| Property | Type |
|---|---|
| `x?` | number |
| `y?` | number |
| `xScale?` | number |
| `yScale?` | number |
| `rotate?` | Rotation |
| `color?` | Color |
| `opacity?` | number |
| `borderColor?` | Color |
| `borderOpacity?` | number |
| `borderWidth?` | number |
| `borderDashArray?` | number[] |
| `borderDashPhase?` | number |
| `borderLineCap?` | LineCapStyle |
| `blendMode?` | BlendMode |

### PDFPageDrawSVGOptions

| Property | Type |
|---|---|
| `x?` | number |
| `y?` | number |
| `scale?` | number |
| `rotate?` | Rotation |
| `color?` | Color |
| `opacity?` | number |
| `borderWidth?` | number |
| `borderColor?` | Color |
| `borderOpacity?` | number |
| `borderDashArray?` | number[] |
| `borderDashPhase?` | number |
| `borderLineCap?` | LineCapStyle |
| `blendMode?` | BlendMode |

### PDFPageDrawPageOptions

| Property | Type |
|---|---|
| `x?` | number |
| `y?` | number |
| `xScale?` | number |
| `yScale?` | number |
| `width?` | number |
| `height?` | number |
| `rotate?` | Rotation |
| `xSkew?` | Rotation |
| `ySkew?` | Rotation |
| `opacity?` | number |
| `blendMode?` | BlendMode |

---

## Enums

### StandardFonts

| Member | Value |
|---|---|
| `Courier` | `"Courier"` |
| `CourierBold` | `"Courier-Bold"` |
| `CourierOblique` | `"Courier-Oblique"` |
| `CourierBoldOblique` | `"Courier-BoldOblique"` |
| `Helvetica` | `"Helvetica"` |
| `HelveticaBold` | `"Helvetica-Bold"` |
| `HelveticaOblique` | `"Helvetica-Oblique"` |
| `HelveticaBoldOblique` | `"Helvetica-BoldOblique"` |
| `TimesRoman` | `"Times-Roman"` |
| `TimesRomanBold` | `"Times-Bold"` |
| `TimesRomanItalic` | `"Times-Italic"` |
| `TimesRomanBoldItalic` | `"Times-BoldItalic"` |
| `Symbol` | `"Symbol"` |
| `ZapfDingbats` | `"ZapfDingbats"` |

### BlendMode

`Normal` | `Multiply` | `Screen` | `Overlay` | `Darken` | `Lighten` | `ColorDodge` | `ColorBurn` | `HardLight` | `SoftLight` | `Difference` | `Exclusion`

### TextAlignment

`Left` | `Center` | `Right`

### LineCapStyle

`Butt` | `Round` | `Projecting`

### LineJoinStyle

`Miter` | `Round` | `Bevel`

### ParseSpeeds

`Fastest` | `Fast` | `Medium` | `Slow`

### ImageAlignment

`Left` | `Center` | `Right`

---

## Color & Rotation Helpers

```typescript
import { rgb, cmyk, grayscale, degrees, radians } from 'pdf-lib'

// Colors (all values 0-1)
rgb(r: number, g: number, b: number): RGB
cmyk(c: number, m: number, y: number, k: number): CMYK
grayscale(gray: number): Grayscale

// Rotation
degrees(angle: number): Degrees
radians(angle: number): Radians

// Color type = RGB | CMYK | Grayscale
// Rotation type = Degrees | Radians
```

---

## Options Interfaces

### SaveOptions

| Property | Type | Description |
|---|---|---|
| `useObjectStreams?` | boolean | Enable object stream compression |
| `addDefaultPage?` | boolean | Add blank page if empty |
| `objectsPerTick?` | number | Processing batch size |
| `updateFieldAppearances?` | boolean | Refresh form field appearances |

### Base64SaveOptions (extends SaveOptions)

| Property | Type | Description |
|---|---|---|
| `dataUri?` | boolean | Return as `data:application/pdf;base64,...` |

### LoadOptions

| Property | Type | Description |
|---|---|---|
| `ignoreEncryption?` | boolean | Bypass encryption checks |
| `parseSpeed?` | ParseSpeeds \| number | Parsing speed |
| `throwOnInvalidObject?` | boolean | Error on malformed objects |
| `updateMetadata?` | boolean | Update metadata on load |
| `capNumbers?` | boolean | Cap number values |

### CreateOptions

| Property | Type | Description |
|---|---|---|
| `updateMetadata?` | boolean | Set default metadata |
