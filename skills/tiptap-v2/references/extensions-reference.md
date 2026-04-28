# TipTap v2 — Extensions Complete Reference

All extensions included in StarterKit plus the three optional extensions
used in this project (`@tiptap/extension-image`, `@tiptap/extension-link`,
`@tiptap/extension-placeholder`).

---

## Table of Contents

1. [StarterKit Node Extensions](#1-starterkit-node-extensions)
2. [StarterKit Mark Extensions](#2-starterkit-mark-extensions)
3. [StarterKit Functionality Extensions](#3-starterkit-functionality-extensions)
4. [Image Extension](#4-image-extension)
5. [Link Extension](#5-link-extension)
6. [Placeholder Extension](#6-placeholder-extension)
7. [StarterKit Configuration](#7-starterkit-configuration)
8. [Keyboard Shortcuts Quick Reference](#8-keyboard-shortcuts-quick-reference)
9. [Input Rules Quick Reference](#9-input-rules-quick-reference)

---

## 1. StarterKit Node Extensions

### Document

The top-level node. Every editor needs exactly one.

- **Name**: `doc`
- **Schema**: `topNode: true`, `content: 'block+'`
- **HTML**: N/A (not rendered)
- **Commands**: None
- **Package**: `@tiptap/extension-document`

### Paragraph

The default block-level text container.

- **Name**: `paragraph`
- **Schema**: `group: 'block'`, `content: 'inline*'`
- **HTML**: `<p>`
- **Commands**: `setParagraph()`
- **Shortcuts**: None
- **Package**: `@tiptap/extension-paragraph`

### Text

Inline text content.

- **Name**: `text`
- **Schema**: `group: 'inline'`, inline text node
- **HTML**: Plain text
- **Commands**: None
- **Package**: `@tiptap/extension-text`

### Heading

Multi-level headings.

- **Name**: `heading`
- **Schema**: `group: 'block'`, `content: 'inline*'`
- **HTML**: `<h1>` through `<h6>`
- **Attributes**: `level` (number, 1-6)
- **Package**: `@tiptap/extension-heading`

**Configuration**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `levels` | `number[]` | `[1,2,3,4,5,6]` | Allowed heading levels |
| `HTMLAttributes` | `Record<string, any>` | `{}` | Custom HTML attributes |

**Commands**:

```ts
editor.commands.setHeading({ level: 2 })    // Convert to h2
editor.commands.toggleHeading({ level: 2 }) // Toggle h2 <-> paragraph
```

**Keyboard Shortcuts**:

| Level | Windows/Linux | macOS |
|-------|---------------|-------|
| H1 | `Ctrl+Alt+1` | `Cmd+Alt+1` |
| H2 | `Ctrl+Alt+2` | `Cmd+Alt+2` |
| H3 | `Ctrl+Alt+3` | `Cmd+Alt+3` |
| H4 | `Ctrl+Alt+4` | `Cmd+Alt+4` |
| H5 | `Ctrl+Alt+5` | `Cmd+Alt+5` |
| H6 | `Ctrl+Alt+6` | `Cmd+Alt+6` |

**Input Rules**: Type `#` + space for H1, `##` + space for H2, etc.

### Blockquote

Block-level quote container.

- **Name**: `blockquote`
- **Schema**: `group: 'block'`, `content: 'block+'`
- **HTML**: `<blockquote>`
- **Package**: `@tiptap/extension-blockquote`

**Configuration**:

| Option | Type | Default |
|--------|------|---------|
| `HTMLAttributes` | `Record<string, any>` | `{}` |

**Commands**:

```ts
editor.commands.setBlockquote()     // Wrap in blockquote
editor.commands.toggleBlockquote()  // Toggle blockquote
editor.commands.unsetBlockquote()   // Unwrap blockquote
```

**Keyboard Shortcuts**: `Ctrl+Shift+B` / `Cmd+Shift+B`

**Input Rules**: Type `>` + space at line start.

### BulletList

Unordered list.

- **Name**: `bulletList`
- **Schema**: `group: 'block'`, `content: 'listItem+'`
- **HTML**: `<ul>`
- **Package**: `@tiptap/extension-bullet-list`

**Configuration**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `HTMLAttributes` | `Record<string, any>` | `{}` | Custom HTML attributes |
| `itemTypeName` | `string` | `'listItem'` | Name of list item node |
| `keepMarks` | `boolean` | `false` | Preserve marks when toggling |
| `keepAttributes` | `boolean` | `false` | Preserve attributes when toggling |

**Commands**:

```ts
editor.commands.toggleBulletList()
```

**Keyboard Shortcuts**: `Ctrl+Shift+8` / `Cmd+Shift+8`

**Input Rules**: Type `*`, `-`, or `+` + space at line start.

### OrderedList

Numbered list.

- **Name**: `orderedList`
- **Schema**: `group: 'block'`, `content: 'listItem+'`
- **HTML**: `<ol>`
- **Package**: `@tiptap/extension-ordered-list`

**Configuration**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `HTMLAttributes` | `Record<string, any>` | `{}` | Custom HTML attributes |
| `itemTypeName` | `string` | `'listItem'` | Name of list item node |
| `keepMarks` | `boolean` | `false` | Preserve marks when toggling |
| `keepAttributes` | `boolean` | `false` | Preserve attributes when toggling |

**Commands**:

```ts
editor.commands.toggleOrderedList()
```

**Keyboard Shortcuts**: `Ctrl+Shift+7` / `Cmd+Shift+7`

**Input Rules**: Type `1.` + space at line start.

### ListItem

Individual list item within BulletList or OrderedList.

- **Name**: `listItem`
- **Schema**: `content: 'paragraph block*'`
- **HTML**: `<li>`
- **Package**: `@tiptap/extension-list-item`

**Commands**:

```ts
editor.commands.liftListItem('listItem')  // Outdent
editor.commands.sinkListItem('listItem')  // Indent
editor.commands.splitListItem('listItem') // Split at cursor
```

**Keyboard Shortcuts**: `Tab` (indent), `Shift+Tab` (outdent), `Enter` (split)

### CodeBlock

Fenced code blocks.

- **Name**: `codeBlock`
- **Schema**: `group: 'block'`, `content: 'text*'`, `marks: ''`, `code: true`
- **HTML**: `<pre><code>`
- **Package**: `@tiptap/extension-code-block`

**Configuration**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `languageClassPrefix` | `string` | `'language-'` | CSS class prefix for language |
| `exitOnTripleEnter` | `boolean` | `true` | Exit on 3x Enter |
| `exitOnArrowDown` | `boolean` | `true` | Exit with arrow down at end |
| `defaultLanguage` | `string \| null` | `null` | Fallback language |
| `HTMLAttributes` | `Record<string, any>` | `{}` | Custom HTML attributes |

**Commands**:

```ts
editor.commands.setCodeBlock()     // Convert to code block
editor.commands.toggleCodeBlock()  // Toggle code block
```

**Keyboard Shortcuts**: `Ctrl+Alt+C` / `Cmd+Alt+C`

**Input Rules**: Type ` ``` ` + space (triple backticks) or `~~~` + space.

### HorizontalRule

Horizontal divider.

- **Name**: `horizontalRule`
- **Schema**: `group: 'block'`
- **HTML**: `<hr>`
- **Package**: `@tiptap/extension-horizontal-rule`

**Configuration**:

| Option | Type | Default |
|--------|------|---------|
| `HTMLAttributes` | `Record<string, any>` | `{}` |

**Commands**:

```ts
editor.commands.setHorizontalRule()
```

**Input Rules**: Type `---` at line start.

### HardBreak

Line break within a block (not paragraph break).

- **Name**: `hardBreak`
- **Schema**: `group: 'inline'`, `inline: true`
- **HTML**: `<br>`
- **Package**: `@tiptap/extension-hard-break`

**Commands**:

```ts
editor.commands.setHardBreak()
```

**Keyboard Shortcuts**: `Shift+Enter`, `Ctrl+Enter` / `Cmd+Enter`

---

## 2. StarterKit Mark Extensions

### Bold

- **Name**: `bold`
- **HTML**: `<strong>` (also parses `<b>` and `font-weight` CSS)
- **Package**: `@tiptap/extension-bold`

**Configuration**:

| Option | Type | Default |
|--------|------|---------|
| `HTMLAttributes` | `Record<string, any>` | `{}` |

**Commands**:

```ts
editor.commands.setBold()     // Apply bold
editor.commands.toggleBold()  // Toggle bold
editor.commands.unsetBold()   // Remove bold
```

**Keyboard Shortcuts**: `Ctrl+B` / `Cmd+B`

**Input Rules**: Wrap text with `**asterisks**` or `__underscores__`.

### Italic

- **Name**: `italic`
- **HTML**: `<em>` (also parses `<i>` and `font-style: italic`)
- **Package**: `@tiptap/extension-italic`

**Configuration**:

| Option | Type | Default |
|--------|------|---------|
| `HTMLAttributes` | `Record<string, any>` | `{}` |

**Commands**:

```ts
editor.commands.setItalic()     // Apply italic
editor.commands.toggleItalic()  // Toggle italic
editor.commands.unsetItalic()   // Remove italic
```

**Keyboard Shortcuts**: `Ctrl+I` / `Cmd+I`

**Input Rules**: Wrap text with `*single asterisks*` or `_single underscores_`.

### Strike

- **Name**: `strike`
- **HTML**: `<s>` (also parses `<del>`, `<strike>`, `text-decoration: line-through`)
- **Package**: `@tiptap/extension-strike`

**Configuration**:

| Option | Type | Default |
|--------|------|---------|
| `HTMLAttributes` | `Record<string, any>` | `{}` |

**Commands**:

```ts
editor.commands.setStrike()     // Apply strikethrough
editor.commands.toggleStrike()  // Toggle strikethrough
editor.commands.unsetStrike()   // Remove strikethrough
```

**Keyboard Shortcuts**: `Ctrl+Shift+S` / `Cmd+Shift+S`

**Input Rules**: Wrap text with `~~tildes~~`.

### Code (inline)

- **Name**: `code`
- **HTML**: `<code>`
- **Package**: `@tiptap/extension-code`

**Configuration**:

| Option | Type | Default |
|--------|------|---------|
| `HTMLAttributes` | `Record<string, any>` | `{}` |

**Commands**:

```ts
editor.commands.setCode()     // Apply inline code
editor.commands.toggleCode()  // Toggle inline code
editor.commands.unsetCode()   // Remove inline code
```

**Keyboard Shortcuts**: `Ctrl+E` / `Cmd+E`

**Input Rules**: Wrap text with `` `backticks` ``.

---

## 3. StarterKit Functionality Extensions

### History (Undo/Redo)

- **Name**: `history`
- **Package**: `@tiptap/extension-history`

**Configuration**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `depth` | `number` | `100` | Max undo steps |
| `newGroupDelay` | `number` | `500` | Ms before new undo group |

**Commands**:

```ts
editor.commands.undo()  // Undo last change
editor.commands.redo()  // Redo last undo
```

**Keyboard Shortcuts**:
- Undo: `Ctrl+Z` / `Cmd+Z`
- Redo: `Ctrl+Shift+Z` / `Cmd+Shift+Z` or `Ctrl+Y` / `Cmd+Y`

### Dropcursor

Visual feedback when dragging content. Shows a cursor line at drop position.

- **Name**: `dropcursor`
- **Package**: `@tiptap/extension-dropcursor`

**Configuration**:

| Option | Type | Default |
|--------|------|---------|
| `color` | `string` | `'currentColor'` |
| `width` | `number` | `1` |
| `class` | `string \| undefined` | `undefined` |

### Gapcursor

Allows cursor placement in positions that normally are unreachable
(e.g., before/after a table, at document start/end next to atom nodes).

- **Name**: `gapcursor`
- **Package**: `@tiptap/extension-gapcursor`
- **No configuration options**

---

## 4. Image Extension

Full details in SKILL.md section 8.

- **Name**: `image`
- **Schema**: `group: 'block'` (or inline if configured), `atom: true` (v2 does not support inline editable content)
- **HTML**: `<img>`
- **Package**: `@tiptap/extension-image`

**Configuration**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `inline` | `boolean` | `false` | Render inline |
| `allowBase64` | `boolean` | `false` | Allow base64 src |
| `HTMLAttributes` | `Record<string, any>` | `{}` | Custom attributes |

**Commands**:

```ts
editor.commands.setImage({ src, alt?, title? })
```

**Attributes** (on the node):

| Attribute | Type | Default |
|-----------|------|---------|
| `src` | `string` | `null` |
| `alt` | `string` | `null` |
| `title` | `string` | `null` |

---

## 5. Link Extension

Full details in SKILL.md section 9.

- **Name**: `link`
- **Schema**: Mark type
- **HTML**: `<a>`
- **Package**: `@tiptap/extension-link`

**Configuration**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `openOnClick` | `boolean` | `true` | Open on click |
| `linkOnPaste` | `boolean` | `true` | Auto-link pasted URLs |
| `autolink` | `boolean` | `true` | Auto-detect while typing |
| `protocols` | `(string \| ProtocolConfig)[]` | `[]` | Additional protocols |
| `defaultProtocol` | `string` | `'http'` | Default for autolinks |
| `HTMLAttributes` | `Record<string, any>` | `{}` | Custom attributes |
| `validate` | `(url: string) => boolean` | — | URL validation |

**Commands**:

```ts
editor.commands.setLink({ href, target? })
editor.commands.toggleLink({ href, target? })
editor.commands.unsetLink()
```

**Getting attributes**:

```ts
editor.getAttributes('link').href    // current href
editor.getAttributes('link').target  // current target
editor.isActive('link')              // is link active
```

---

## 6. Placeholder Extension

Full details in SKILL.md section 10.

- **Name**: `placeholder`
- **Package**: `@tiptap/extension-placeholder`

**Configuration**:

| Option | Type | Default |
|--------|------|---------|
| `placeholder` | `string \| ((params) => string)` | `'Write something ...'` |
| `emptyEditorClass` | `string` | `'is-editor-empty'` |
| `emptyNodeClass` | `string` | `'is-empty'` |
| `showOnlyWhenEditable` | `boolean` | `true` |
| `showOnlyCurrent` | `boolean` | `true` |
| `includeChildren` | `boolean` | `false` |
| `considerAnyAsEmpty` | `boolean` | `false` |

---

## 7. StarterKit Configuration

```ts
import StarterKit from '@tiptap/starter-kit';

StarterKit.configure({
  // Disable extensions by setting to false
  history: false,
  codeBlock: false,

  // Configure extensions by passing options
  heading: {
    levels: [1, 2, 3],
  },

  // All extensions configurable:
  // document, paragraph, text, heading, blockquote,
  // bulletList, orderedList, listItem, codeBlock,
  // horizontalRule, hardBreak,
  // bold, italic, strike, code,
  // history, dropcursor, gapcursor
})
```

### Disabling an extension to use standalone version

```ts
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      codeBlock: false, // disable built-in
    }),
    CodeBlockLowlight.configure({
      // use extended version
    }),
  ],
});
```

---

## 8. Keyboard Shortcuts Quick Reference

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Bold | `Ctrl+B` | `Cmd+B` |
| Italic | `Ctrl+I` | `Cmd+I` |
| Strike | `Ctrl+Shift+S` | `Cmd+Shift+S` |
| Inline code | `Ctrl+E` | `Cmd+E` |
| Heading 1 | `Ctrl+Alt+1` | `Cmd+Alt+1` |
| Heading 2 | `Ctrl+Alt+2` | `Cmd+Alt+2` |
| Heading 3 | `Ctrl+Alt+3` | `Cmd+Alt+3` |
| Blockquote | `Ctrl+Shift+B` | `Cmd+Shift+B` |
| Bullet list | `Ctrl+Shift+8` | `Cmd+Shift+8` |
| Ordered list | `Ctrl+Shift+7` | `Cmd+Shift+7` |
| Code block | `Ctrl+Alt+C` | `Cmd+Alt+C` |
| Hard break | `Shift+Enter` | `Shift+Enter` |
| Undo | `Ctrl+Z` | `Cmd+Z` |
| Redo | `Ctrl+Shift+Z` | `Cmd+Shift+Z` |

---

## 9. Input Rules Quick Reference

| Trigger | Result |
|---------|--------|
| `**text**` or `__text__` | Bold |
| `*text*` or `_text_` | Italic |
| `~~text~~` | Strikethrough |
| `` `text` `` | Inline code |
| `# ` | Heading 1 |
| `## ` | Heading 2 |
| `### ` | Heading 3 |
| `> ` | Blockquote |
| `* ` or `- ` or `+ ` | Bullet list |
| `1. ` | Ordered list |
| ```` ``` ```` | Code block |
| `---` | Horizontal rule |
