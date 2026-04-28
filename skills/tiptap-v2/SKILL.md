---
name: tiptap-v2
description: >
  TipTap v2 rich text editor complete API reference for React integration.
  Covers useEditor hook, EditorContent, Editor class API, commands, events,
  StarterKit extensions (Bold/Italic/Strike/Code/Heading/BulletList/OrderedList/
  Blockquote/CodeBlock/HorizontalRule/History), Image/Link/Placeholder extensions,
  custom extension creation (Node/Mark/Extension), schema, content serialization,
  React node views, and toolbar patterns.
  Use this skill whenever the task involves @tiptap/react, @tiptap/starter-kit,
  @tiptap/core, @tiptap/pm, @tiptap/extension-image, @tiptap/extension-link,
  @tiptap/extension-placeholder, useEditor, EditorContent, or any TipTap
  rich text editor work. Also use when building toolbars, custom extensions,
  or working with ProseMirror schema through TipTap.
  THIS SKILL IS FOR v2 (^2.2.0). Do NOT mix in v3 APIs.
---

# TipTap v2 -- Complete API Reference

> **Version**: `@tiptap/*` ^2.2.0. Do NOT use v3 APIs (UndoRedo rename,
> `@tiptap/extensions` consolidation, `@tiptap/react/menus` import path,
> Floating UI replacement, StarterKit Link/Underline/ListKeymap defaults).

**Reference files** (read when you need deeper detail):
- [references/extensions-reference.md](references/extensions-reference.md) -- per-extension config, commands, shortcuts, input rules
- [references/custom-extensions.md](references/custom-extensions.md) -- Node/Mark/Extension creation patterns, all hooks, project examples

---

## 1. Installation

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder
```

## 2. useEditor Hook

```ts
import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';

const editor: Editor | null = useEditor(options, deps?);
```

**Key options** (extends `Partial<EditorOptions>`):

| Option | Type | Default | Notes |
|--------|------|---------|-------|
| `extensions` | `Extension[]` | `[]` | Required |
| `content` | `string \| JSONContent` | `''` | Initial HTML or JSON |
| `editable` | `boolean` | `true` | Read-only mode |
| `autofocus` | `boolean \| 'start' \| 'end' \| 'all' \| number` | `false` | |
| `immediatelyRender` | `boolean` | `true` | **Set `false` for Next.js SSR** |
| `shouldRerenderOnTransaction` | `boolean` | `true` | v2 default; perf toggle |
| `editorProps` | `EditorProps` | `{}` | ProseMirror EditorProps |
| `injectCSS` | `boolean` | `true` | Default ProseMirror styles |
| `enableInputRules` | `boolean` | `true` | Markdown-like auto-formatting |
| `enablePasteRules` | `boolean` | `true` | Auto-format on paste |
| Event callbacks | `onCreate`, `onUpdate`, `onSelectionUpdate`, `onTransaction`, `onFocus`, `onBlur`, `onDestroy` |

**deps** (2nd arg): optional React dependency array; editor recreates when deps change.

**Lifecycle**: creates editor -> returns `null` first render if `immediatelyRender: false` -> recreates on deps change -> destroys on unmount.

## 3. EditorContent & Context

```tsx
<EditorContent editor={editor} />
```

Share editor via context:

```tsx
import { EditorContext, useCurrentEditor } from '@tiptap/react';
const value = useMemo(() => ({ editor }), [editor]);
<EditorContext.Provider value={value}><EditorContent editor={editor} /><Toolbar /></EditorContext.Provider>

// In child:
const { editor } = useCurrentEditor();
```

## 4. Editor API

### Properties

`isEditable`, `isEmpty`, `isFocused`, `isDestroyed`, `schema`, `state`, `view`, `storage`

### Core methods

```ts
editor.getHTML()                    // => string
editor.getJSON()                    // => JSONContent
editor.getText()                    // => string
editor.getAttributes('link')       // => { href, target, ... }
editor.isActive('bold')            // => boolean
editor.isActive('heading', { level: 2 })
editor.can().toggleBold()          // dry-run => boolean
editor.chain().focus().toggleBold().run()  // chained execution
editor.setEditable(false)
editor.destroy()
```

## 5. Commands

Execute: `editor.commands.X()` or `editor.chain().focus().X().run()`

**Content**: `setContent(html|json, emitUpdate?)`, `insertContent(content)`, `insertContentAt(pos, content)`, `clearContent(emitUpdate?)`

**Marks**: `setMark(name, attrs?)`, `toggleMark(name, attrs?)`, `unsetMark(name)`, `extendMarkRange(name)`, `unsetAllMarks()`

**Nodes**: `setNode(name, attrs?)`, `toggleNode(name, toggle, attrs?)`, `clearNodes()`, `updateAttributes(name, attrs)`, `deleteNode(name)`, `lift(name)`

**Selection**: `focus(pos?)`, `blur()`, `selectAll()`, `deleteSelection()`, `setTextSelection(pos|range)`, `setNodeSelection(pos)`, `scrollIntoView()`

**Lists**: `toggleBulletList()`, `toggleOrderedList()`, `liftListItem(name)`, `sinkListItem(name)`, `splitListItem(name)`

**History**: `undo()`, `redo()`

**Advanced**:
```ts
// Direct transaction access
editor.chain().focus().command(({ tr }) => { tr.insertText('hi'); return true; }).run()
// Try first successful command
editor.commands.first(({ commands }) => [() => commands.undoInputRule(), () => commands.deleteSelection()])
```

## 6. Events

```ts
// In useEditor config:
useEditor({ onUpdate({ editor }) {}, onSelectionUpdate({ editor }) {}, ... })

// Dynamic binding:
editor.on('update', handler);  editor.off('update', handler);
```

Events: `beforeCreate`, `create`, `update`, `selectionUpdate`, `transaction` (receives `{ editor, transaction }`), `focus`/`blur` (receives `{ editor, event }`), `destroy`, `contentError`

## 7. StarterKit

Bundles: **Nodes** (Document, Paragraph, Text, Heading, Blockquote, BulletList, OrderedList, ListItem, CodeBlock, HorizontalRule, HardBreak), **Marks** (Bold, Italic, Strike, Code), **Functionality** (History, Dropcursor, Gapcursor).

```ts
StarterKit.configure({
  history: false,              // disable
  heading: { levels: [1,2,3] }, // configure
  codeBlock: {},               // default config
})
```

See [references/extensions-reference.md](references/extensions-reference.md) for per-extension commands/shortcuts/config.

## 8. Image Extension

```ts
Image.configure({ inline: false, allowBase64: false, HTMLAttributes: {} })
editor.chain().focus().setImage({ src, alt?, title? }).run()
```

## 9. Link Extension

```ts
Link.configure({ openOnClick: false, autolink: true, protocols: ['http','https','mailto'], HTMLAttributes: { target: '_blank' } })
editor.chain().focus().extendMarkRange('link').setLink({ href, target? }).run()
editor.chain().focus().extendMarkRange('link').unsetLink().run()
editor.getAttributes('link').href  // read current
```

## 10. Placeholder Extension

```ts
Placeholder.configure({ placeholder: 'Write...' })
// or per-node: placeholder: ({ node }) => node.type.name === 'heading' ? 'Title?' : 'Write...'
```

Required CSS:
```css
.tiptap p.is-editor-empty:first-child::before {
  color: #adb5bd; content: attr(data-placeholder); float: left; height: 0; pointer-events: none;
}
```

## 11. Custom Extensions (Summary)

```ts
import { Extension, Node, Mark } from '@tiptap/core';
```

| Type | Schema? | Use for |
|------|---------|---------|
| `Extension.create()` | No | Behavior, shortcuts, plugins |
| `Node.create()` | Yes | Document structure (blocks, inline atoms) |
| `Mark.create()` | Yes | Inline formatting |

Key hooks: `addOptions`, `addStorage`, `addCommands`, `addKeyboardShortcuts`, `addInputRules`, `addPasteRules`, `addProseMirrorPlugins`, `addGlobalAttributes`, lifecycle events.

Node-specific: `group`, `content`, `atom`, `inline`, `defining`, `draggable`, `selectable`, `marks`, `addAttributes`, `parseHTML`, `renderHTML`, `addNodeView`.

Mark-specific: `inclusive`, `excludes`, `exitable`, `spanning`, `code`, `group`.

Extend existing: `const Custom = Original.extend({ ...this.parent?.(), newStuff })`

Full patterns and project examples in [references/custom-extensions.md](references/custom-extensions.md).

## 12. Schema

Auto-generated from extensions. Access: `editor.schema` or `getSchema([extensions])`.

Content expressions: `'block+'` (1+ blocks), `'inline*'` (0+ inline), `'text*'` (text only).
Groups: nodes declare `group: 'block'`, content references groups.
Marks config: `'_'` (all), `''` (none), `'bold italic'` (specific).

## 13. Content Serialization

```ts
// From editor
editor.getHTML(); editor.getJSON(); editor.getText();

// Server-side (no editor)
import { generateHTML, generateJSON } from '@tiptap/html';
generateHTML(json, [Document, Paragraph, Text, Bold]);
generateJSON('<p>Hello</p>', [Document, Paragraph, Text]);

// Setting content
editor.commands.setContent(html, false); // false = no onUpdate
editor.commands.insertContent(htmlOrJson);
```

Pass same extensions used in editor. Missing extensions = silently dropped content.

## 14. React Node Views

```tsx
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';

const MyNode = Node.create({
  name: 'myNode', group: 'block', atom: true,
  addNodeView() { return ReactNodeViewRenderer(MyComponent); },
});

function MyComponent({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  return (
    <NodeViewWrapper className="my-node">
      {/* NodeViewContent for editable content; omit for atom nodes */}
      <input value={node.attrs.x} onChange={e => updateAttributes({ x: e.target.value })} />
    </NodeViewWrapper>
  );
}
```

NodeViewProps: `node`, `editor`, `getPos`, `updateAttributes`, `deleteNode`, `selected`, `extension`, `decorations`.

## 15. Toolbar Pattern

```tsx
<button onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'active' : ''}>Bold</button>
<button onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}>Undo</button>
```

BubbleMenu / FloatingMenu (v2 imports from `@tiptap/react`, uses `tippyOptions`):
```tsx
import { BubbleMenu, FloatingMenu } from '@tiptap/react';
<BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>...</BubbleMenu>
```

## 16. SSR & Performance

1. `'use client'` directive
2. `immediatelyRender: false`
3. Handle `null` editor

Avoid cursor jumps on external sync:
```tsx
useEffect(() => {
  if (!editor) return;
  if ((value?.html || '') !== editor.getHTML()) {
    editor.commands.setContent(value?.html || '', false);
  }
}, [editor, value?.html]);
```

Performance: extract toolbar to separate component; use `onTransaction` + local state instead of full re-renders.

## 17. Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| SSR hydration mismatch | `immediatelyRender: false`, handle `null` editor |
| Cursor jumps on setContent | Compare HTML first, pass `false` for emitUpdate |
| Stale editor in callbacks | Use callback params `{ editor }`, not closure |
| Toolbar not updating on selection | `onSelectionUpdate`/`onTransaction` + state |
| Content silently lost | Register all extensions that created the content |
| `getPos` undefined | v3 only; v2 always returns number |
| Duplicate extensions | Names must be unique; use `.extend()` |
