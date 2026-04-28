# TipTap v2 — Custom Extensions In-Depth

Complete guide to creating Node, Mark, and Extension (functionality) extensions.

---

## Table of Contents

1. [Extension Types Overview](#1-extension-types-overview)
2. [Creating a Node Extension](#2-creating-a-node-extension)
3. [Creating a Mark Extension](#3-creating-a-mark-extension)
4. [Creating a Functionality Extension](#4-creating-a-functionality-extension)
5. [Extending Existing Extensions](#5-extending-existing-extensions)
6. [addAttributes() Deep Dive](#6-addattributes-deep-dive)
7. [parseHTML() Deep Dive](#7-parsehtml-deep-dive)
8. [renderHTML() Deep Dive](#8-renderhtml-deep-dive)
9. [addCommands() Deep Dive](#9-addcommands-deep-dive)
10. [addKeyboardShortcuts()](#10-addkeyboardshortcuts)
11. [addInputRules() and addPasteRules()](#11-addinputrules-and-addpasterules)
12. [addProseMirrorPlugins()](#12-addprosemirrorplugins)
13. [addNodeView() — React Node Views](#13-addnodeview--react-node-views)
14. [Storage and Options](#14-storage-and-options)
15. [Global Attributes](#15-global-attributes)
16. [Extension Context (this)](#16-extension-context-this)
17. [Complete Examples from This Project](#17-complete-examples-from-this-project)

---

## 1. Extension Types Overview

```ts
import { Extension, Node, Mark } from '@tiptap/core';
```

| Type | Purpose | Modifies Schema? |
|------|---------|-------------------|
| `Extension` | Add functionality (shortcuts, plugins, events) | No |
| `Node` | Add document structure (blocks, inline nodes) | Yes — adds node type |
| `Mark` | Add inline formatting (bold, link, highlight) | Yes — adds mark type |

All three types share the same lifecycle hooks and most methods.
Node and Mark add schema-specific options (group, content, parseHTML, renderHTML, etc.).

---

## 2. Creating a Node Extension

### Minimal block node

```ts
import { Node, mergeAttributes } from '@tiptap/core';

const CustomBlock = Node.create({
  name: 'customBlock',
  group: 'block',
  content: 'inline*',

  parseHTML() {
    return [{ tag: 'div[data-custom-block]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-custom-block': '' }), 0];
  },
});
```

### Atom node (no editable content)

```ts
const CustomAtom = Node.create({
  name: 'customAtom',
  group: 'block',
  atom: true,       // key: treated as a single unit

  addAttributes() {
    return {
      src: { default: '' },
      caption: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-custom-atom]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-custom-atom': '' })];
    // Note: no `0` at the end — atom nodes have no content hole
  },
});
```

### Inline node

```ts
const Mention = Node.create({
  name: 'mention',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: false,

  addAttributes() {
    return {
      id: { default: null },
      label: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-mention]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-mention': '' }), `@${node.attrs.label}`];
  },
});
```

### Node schema properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | required | Unique identifier |
| `group` | `string` | `undefined` | Node group: `'block'`, `'inline'`, or custom |
| `content` | `string` | `undefined` | Allowed children: `'inline*'`, `'block+'`, `'text*'` |
| `marks` | `string` | `'_'` | Allowed marks: `'_'` (all), `''` (none), `'bold italic'` |
| `inline` | `boolean` | `false` | Inline node |
| `atom` | `boolean` | `false` | Treated as single unit, no editable content |
| `selectable` | `boolean` | `true` | Can be selected with cursor |
| `draggable` | `boolean` | `false` | Can be dragged |
| `code` | `boolean` | `false` | Contains code content |
| `whitespace` | `'normal' \| 'pre'` | `'normal'` | Whitespace handling |
| `defining` | `boolean` | `false` | Persists during content replacement |
| `isolating` | `boolean` | `false` | Cursor cannot cross boundaries |
| `topNode` | `boolean` | `false` | Is this the document root |
| `allowGapCursor` | `boolean` | — | Allow gap cursor before/after |

---

## 3. Creating a Mark Extension

### Basic mark

```ts
import { Mark, mergeAttributes } from '@tiptap/core';

const Highlight = Mark.create({
  name: 'highlight',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [{ tag: 'mark' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setHighlight: () => ({ commands }) => commands.setMark(this.name),
      toggleHighlight: () => ({ commands }) => commands.toggleMark(this.name),
      unsetHighlight: () => ({ commands }) => commands.unsetMark(this.name),
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-h': () => this.editor.commands.toggleHighlight(),
    };
  },
});
```

### Mark-specific schema properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `inclusive` | `boolean` | `true` | Mark continues when typing at boundary |
| `excludes` | `string` | `''` | Mutually exclusive marks (space-separated, `'_'` = all) |
| `exitable` | `boolean` | `false` | Can exit mark via backspace at boundary |
| `spanning` | `boolean` | `true` | Can span across multiple nodes |
| `code` | `boolean` | `false` | Code formatting behavior |
| `group` | `string` | `''` | Mark group for categorization |
| `keepOnSplit` | `boolean` | `true` | Preserve mark when splitting nodes |

### Mark with attributes

```ts
const TextColor = Mark.create({
  name: 'textColor',

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.style.color || null,
        renderHTML: (attributes) => {
          if (!attributes.color) return {};
          return { style: `color: ${attributes.color}` };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span', getAttrs: (el) => el.style.color ? {} : false }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});
```

---

## 4. Creating a Functionality Extension

Extensions that add behavior without modifying the schema.

```ts
import { Extension } from '@tiptap/core';

const CharacterLimit = Extension.create({
  name: 'characterLimit',

  addOptions() {
    return {
      limit: 1000,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        filterTransaction: (transaction) => {
          const { doc } = transaction;
          const size = doc.textContent.length;
          if (size > this.options.limit) return false;
          return true;
        },
      }),
    ];
  },
});
```

---

## 5. Extending Existing Extensions

Use `.extend()` to modify an existing extension without rewriting it.

### Add attributes to existing extension

```ts
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),  // keep existing attributes
      loading: {
        default: 'lazy',
      },
      'data-id': {
        default: null,
      },
    };
  },
});
```

### Override renderHTML

```ts
const CustomBold = Bold.extend({
  renderHTML({ HTMLAttributes }) {
    return ['b', HTMLAttributes, 0];  // use <b> instead of <strong>
  },
});
```

### Add commands to existing extension

```ts
const CustomHeading = Heading.extend({
  addCommands() {
    return {
      ...this.parent?.(),  // keep existing commands
      setHeadingWithId: (attrs) => ({ commands }) => {
        return commands.setHeading({ ...attrs });
      },
    };
  },
});
```

### Override keyboard shortcuts

```ts
const CustomBold = Bold.extend({
  addKeyboardShortcuts() {
    return {
      'Mod-b': () => this.editor.commands.toggleBold(),
      'Mod-Shift-b': () => this.editor.commands.unsetBold(),
    };
  },
});
```

### Change priority

```ts
const HighPriorityLink = Link.extend({
  priority: 1000,  // default is 100; higher = loads first
});
```

---

## 6. addAttributes() Deep Dive

Define custom attributes on nodes and marks.

```ts
addAttributes() {
  return {
    color: {
      // Required: default value
      default: 'red',

      // Parse from HTML element
      parseHTML: (element) => element.getAttribute('data-color'),

      // Render to HTML attributes
      renderHTML: (attributes) => {
        if (!attributes.color) return {};
        return { 'data-color': attributes.color };
      },

      // Whether to render as HTML attribute (default: true)
      // Set false if you handle it in renderHTML() of the node/mark
      rendered: true,

      // Keep this attribute when splitting nodes (default: true)
      keepOnSplit: true,
    },
  };
}
```

### Attribute with no HTML rendering

```ts
addAttributes() {
  return {
    internalId: {
      default: null,
      rendered: false,  // never rendered to HTML
    },
  };
}
```

### Complex attribute

```ts
addAttributes() {
  return {
    items: {
      default: [],
      parseHTML: (element) => {
        // Parse from DOM
        const items = [];
        element.querySelectorAll('.item').forEach((el) => {
          items.push({ text: el.textContent });
        });
        return items;
      },
      // Complex attrs usually handled in the node's renderHTML
      rendered: false,
    },
  };
}
```

---

## 7. parseHTML() Deep Dive

Define how HTML maps to your node/mark when pasting or loading content.

```ts
parseHTML() {
  return [
    // Simple tag match
    { tag: 'blockquote' },

    // Tag with attribute selector
    { tag: 'div[data-type="callout"]' },

    // With getAttrs — return false to skip, object to use
    {
      tag: 'div',
      getAttrs: (element) => {
        if (element.classList.contains('callout')) {
          return { type: element.dataset.calloutType };
        }
        return false;  // don't match
      },
    },

    // Priority (higher = checked first)
    {
      tag: 'div.special',
      priority: 51,  // default is 50
    },

    // Style-based matching (for marks)
    {
      style: 'font-weight',
      getAttrs: (value) => /^(bold|[7-9]\d{2,})$/.test(value) ? {} : false,
    },
  ];
}
```

---

## 8. renderHTML() Deep Dive

Define how your node/mark outputs HTML.

### Array syntax

```ts
renderHTML({ HTMLAttributes }) {
  // [tag, attributes, contentHole]
  return ['div', HTMLAttributes, 0];
  //                             ^ 0 = content goes here
}
```

### Nested elements

```ts
renderHTML({ HTMLAttributes }) {
  return ['div', mergeAttributes(HTMLAttributes, { class: 'wrapper' }), ['p', 0]];
  // outputs: <div class="wrapper"><p>content</p></div>
}
```

### No content hole (atom nodes)

```ts
renderHTML({ HTMLAttributes, node }) {
  return ['img', mergeAttributes(HTMLAttributes, {
    src: node.attrs.src,
    alt: node.attrs.alt,
  })];
  // No `0` — void element
}
```

### With text content

```ts
renderHTML({ node }) {
  return ['span', { 'data-mention': '' }, `@${node.attrs.label}`];
}
```

### mergeAttributes helper

```ts
import { mergeAttributes } from '@tiptap/core';

// Merges multiple attribute objects, handling class concatenation
mergeAttributes(
  { class: 'base' },
  { class: 'extra', id: 'myId' },
  HTMLAttributes  // from the function parameter
)
// => { class: 'base extra', id: 'myId', ...HTMLAttributes }
```

---

## 9. addCommands() Deep Dive

```ts
addCommands() {
  return {
    myCommand: (param1, param2) => ({ tr, dispatch, editor, state, chain, commands, can, view }) => {
      // tr: ProseMirror Transaction
      // dispatch: function to apply changes
      // editor: Editor instance
      // state: current EditorState
      // chain: for chaining sub-commands
      // commands: all available commands
      // can: dry-run any command
      // view: ProseMirror EditorView

      // Use helper commands:
      return commands.insertContent({ type: this.name, attrs: { param1, param2 } });
    },
  };
}
```

### Command that uses insertContent

```ts
addCommands() {
  return {
    insertMyNode: (attrs) => ({ commands }) => {
      return commands.insertContent({ type: this.name, attrs });
    },
  };
}
```

### Command that wraps selection

```ts
addCommands() {
  return {
    setMyMark: (attrs) => ({ commands }) => {
      return commands.setMark(this.name, attrs);
    },
    toggleMyMark: (attrs) => ({ commands }) => {
      return commands.toggleMark(this.name, attrs);
    },
    unsetMyMark: () => ({ commands }) => {
      return commands.unsetMark(this.name);
    },
  };
}
```

### Command with direct transaction manipulation

```ts
addCommands() {
  return {
    removeEmptyParagraphs: () => ({ tr, dispatch }) => {
      const nodesToRemove = [];
      tr.doc.descendants((node, pos) => {
        if (node.type.name === 'paragraph' && node.content.size === 0) {
          nodesToRemove.push(pos);
        }
      });
      // Process in reverse to maintain positions
      nodesToRemove.reverse().forEach((pos) => {
        tr.delete(pos, pos + 1);
      });
      if (dispatch) dispatch(tr);
      return true;
    },
  };
}
```

---

## 10. addKeyboardShortcuts()

```ts
addKeyboardShortcuts() {
  return {
    'Mod-k': () => this.editor.commands.toggleLink(),        // Ctrl/Cmd+K
    'Mod-Shift-x': () => this.editor.commands.toggleStrike(), // Ctrl/Cmd+Shift+X
    'Enter': () => {
      // Return true to prevent default, false to allow
      return false;
    },
    'Tab': ({ editor }) => {
      if (editor.isActive('listItem')) {
        return editor.commands.sinkListItem('listItem');
      }
      return false;
    },
  };
}
```

### Key modifiers

| Modifier | Windows/Linux | macOS |
|----------|---------------|-------|
| `Mod` | `Ctrl` | `Cmd` |
| `Shift` | `Shift` | `Shift` |
| `Alt` | `Alt` | `Option` |

---

## 11. addInputRules() and addPasteRules()

### Input rules (triggered while typing)

```ts
import { markInputRule, nodeInputRule, textblockTypeInputRule, wrappingInputRule } from '@tiptap/core';

addInputRules() {
  return [
    // Mark: **text** -> bold
    markInputRule({
      find: /(?:\*\*)((?:[^*]+))(?:\*\*)$/,
      type: this.type,
    }),

    // Node: creates node when pattern matches
    nodeInputRule({
      find: /---$/,
      type: this.type,
    }),

    // Textblock: converts paragraph to this node type
    textblockTypeInputRule({
      find: /^```$/,
      type: this.type,
    }),

    // Wrapping: wraps in this node type
    wrappingInputRule({
      find: /^>\s$/,
      type: this.type,
    }),
  ];
}
```

### Paste rules (triggered on paste)

```ts
import { markPasteRule } from '@tiptap/core';

addPasteRules() {
  return [
    markPasteRule({
      find: /(?:\*\*)((?:[^*]+))(?:\*\*)/g,  // Note: no $ at end, uses /g
      type: this.type,
    }),
  ];
}
```

---

## 12. addProseMirrorPlugins()

Direct ProseMirror plugin integration.

```ts
import { Plugin, PluginKey } from '@tiptap/pm/state';

addProseMirrorPlugins() {
  return [
    new Plugin({
      key: new PluginKey('myPlugin'),

      // Plugin state
      state: {
        init: () => ({ count: 0 }),
        apply: (tr, value) => {
          if (tr.docChanged) return { count: value.count + 1 };
          return value;
        },
      },

      // View plugin (DOM side effects)
      view(editorView) {
        return {
          update(view, prevState) {
            // Called on state updates
          },
          destroy() {
            // Cleanup
          },
        };
      },

      // Transaction filter
      filterTransaction(transaction) {
        return true; // return false to reject
      },

      // Decoration
      props: {
        decorations(state) {
          // return DecorationSet
        },
        handleDOMEvents: {
          drop(view, event) {
            // handle drop
            return false;
          },
        },
      },
    }),
  ];
}
```

---

## 13. addNodeView() -- React Node Views

```ts
import { ReactNodeViewRenderer } from '@tiptap/react';

addNodeView() {
  return ReactNodeViewRenderer(MyReactComponent);
}
```

### React component for node view

```tsx
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

function MyReactComponent(props: NodeViewProps) {
  const {
    node,              // ProseMirror node
    updateAttributes,  // (attrs: {}) => void
    deleteNode,        // () => void
    editor,            // Editor instance
    getPos,            // () => number
    selected,          // boolean
    extension,         // Extension instance
    decorations,       // Decoration[]
  } = props;

  return (
    <NodeViewWrapper className="my-node" data-type={node.type.name}>
      {/* For nodes with content (content: 'inline*'): */}
      <NodeViewContent className="content" />

      {/* For atom nodes, render custom UI */}
      <div>
        <input
          value={node.attrs.title || ''}
          onChange={(e) => updateAttributes({ title: e.target.value })}
        />
        <button onClick={() => deleteNode()}>Remove</button>
      </div>
    </NodeViewWrapper>
  );
}
```

### NodeViewWrapper props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `as` | `string` | `'div'` | HTML tag to render |
| `className` | `string` | — | CSS class |
| `data-*` | `string` | — | Data attributes |

### Important: NodeViewWrapper is required

Every React node view must wrap its content in `NodeViewWrapper`.
This is how TipTap connects the React component to ProseMirror's DOM.

### Important: NodeViewContent for editable content

Only use `NodeViewContent` when the node has a `content` property.
For `atom: true` nodes, do not use `NodeViewContent`.

---

## 14. Storage and Options

### Options (immutable after configure)

```ts
const MyExtension = Extension.create({
  name: 'myExtension',

  addOptions() {
    return {
      types: [],
      defaultColor: '#000',
    };
  },

  // Access: this.options.defaultColor
});

// User configures:
MyExtension.configure({ defaultColor: '#fff' });
```

### Storage (mutable at runtime)

```ts
const MyExtension = Extension.create({
  name: 'myExtension',

  addStorage() {
    return {
      count: 0,
      active: false,
    };
  },

  onUpdate() {
    this.storage.count++;
  },
});

// Access from outside:
editor.storage.myExtension.count;
```

---

## 15. Global Attributes

Add attributes to multiple extension types at once.

```ts
const TextAlign = Extension.create({
  name: 'textAlign',

  addGlobalAttributes() {
    return [
      {
        types: ['heading', 'paragraph'],  // or ['*'] for all
        attributes: {
          textAlign: {
            default: 'left',
            parseHTML: (element) => element.style.textAlign || 'left',
            renderHTML: (attributes) => {
              if (attributes.textAlign === 'left') return {};
              return { style: `text-align: ${attributes.textAlign}` };
            },
          },
        },
      },
    ];
  },
});
```

---

## 16. Extension Context (this)

Inside extension methods, `this` provides:

| Property | Type | Description |
|----------|------|-------------|
| `this.name` | `string` | Extension name |
| `this.editor` | `Editor` | Editor instance |
| `this.type` | `NodeType \| MarkType` | ProseMirror type (Node/Mark only) |
| `this.options` | `Options` | Configured options |
| `this.storage` | `Storage` | Mutable storage |
| `this.parent` | `ParentConfig` | Parent extension (if extended) |

### Accessing parent methods in extend()

```ts
const Extended = Original.extend({
  addAttributes() {
    return {
      ...this.parent?.(),  // spread parent's attributes
      newAttr: { default: null },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),  // keep parent's commands
      newCommand: () => ({ commands }) => { /* ... */ },
    };
  },
});
```

---

## 17. Complete Examples from This Project

### VideoEmbedExtension (atom node with custom command)

```ts
// Source: apps/web/components/admin/tiptap/VideoEmbedExtension.ts
import { Node, mergeAttributes } from '@tiptap/core';

export interface VideoEmbedAttrs {
  src: string;
  poster?: string | null;
  mediaId?: string;
}

export const VideoEmbedExtension = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: '' },
      poster: { default: null },
      mediaId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'video[data-zenbu-video]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'video',
      mergeAttributes(HTMLAttributes, {
        'data-zenbu-video': '',
        controls: true,
        playsinline: true,
        preload: 'metadata',
      }),
    ];
  },

  addCommands() {
    return {
      insertVideoEmbed: (attrs: VideoEmbedAttrs) => ({ commands }: any) => {
        return commands.insertContent({ type: this.name, attrs });
      },
    } as any;
  },
});
```

### FAQ Extension (atom node with React Node View)

```ts
// Source: apps/web/components/admin/tiptap-faq.tsx
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

export const Faq = Node.create({
  name: 'faq',
  group: 'block',
  atom: true,
  defining: true,

  addAttributes() {
    return {
      items: {
        default: [],
        parseHTML: (el) => {
          const items = [];
          el.querySelectorAll('details').forEach((d) => {
            const q = d.querySelector('summary')?.textContent?.trim() ?? '';
            const a = d.querySelector('div')?.textContent?.trim() ?? '';
            if (q || a) items.push({ q, a });
          });
          return items;
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'section[data-faq="true"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const items = node.attrs.items ?? [];
    return [
      'section',
      mergeAttributes(HTMLAttributes, { 'data-faq': 'true' }),
      ...items.map((it) => [
        'details', {},
        ['summary', {}, it.q ?? ''],
        ['div', {}, it.a ?? ''],
      ]),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FaqNodeView);
  },
});

// React component
function FaqNodeView({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const items = node.attrs.items ?? [];
  const editable = editor?.isEditable ?? true;

  const setItem = (idx, patch) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    updateAttributes({ items: next });
  };

  const addItem = () => updateAttributes({ items: [...items, { q: '', a: '' }] });
  const removeItem = (idx) => updateAttributes({ items: items.filter((_, i) => i !== idx) });

  return (
    <NodeViewWrapper as="div" className="..." data-type="faq">
      {items.map((it, idx) => (
        <div key={idx}>
          <input value={it.q} onChange={(e) => setItem(idx, { q: e.target.value })} />
          <textarea value={it.a} onChange={(e) => setItem(idx, { a: e.target.value })} />
          {editable && <button onClick={() => removeItem(idx)}>Remove</button>}
        </div>
      ))}
      {editable && <button onClick={addItem}>Add Q&A</button>}
    </NodeViewWrapper>
  );
}
```

### Using custom extensions in the editor

```ts
const editor = useEditor({
  immediatelyRender: false,
  extensions: [
    StarterKit.configure({ codeBlock: {} }),
    Image.configure({ inline: false, allowBase64: false }),
    Link.configure({ openOnClick: false, autolink: true, protocols: ['http', 'https', 'mailto'] }),
    Placeholder.configure({ placeholder: 'Start writing...' }),
    Faq,              // custom node with React view
    VideoEmbedExtension, // custom atom node
  ],
  content: value?.html || '',
  editable,
  editorProps: {
    attributes: {
      class: 'tiptap min-h-[320px] focus:outline-none px-4 py-3 text-sm',
    },
  },
  onUpdate({ editor }) {
    onChange({ html: editor.getHTML(), json: editor.getJSON() });
  },
});
```
