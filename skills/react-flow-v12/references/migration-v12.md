# React Flow v12 — Migration & Breaking Changes

> TOC: [Package Rename](#package-rename) | [Node Changes](#node-changes) | [Edge Changes](#edge-changes) | [API Renames](#api-renames) | [Utility Function Renames](#utility-function-renames) | [CSS & Handle Class Changes](#css--handle-class-changes) | [TypeScript Changes](#typescript-changes) | [Immutability Requirement](#immutability-requirement) | [New Features in v12](#new-features-in-v12)

---

## Package Rename

v12 renames the npm package and changes to named exports.

```bash
# Uninstall old
npm uninstall reactflow

# Install new
npm install @xyflow/react
```

```tsx
// v11 (old)
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';

// v12 (new) — named export
import { ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
```

All sub-packages also renamed:

| Old | New |
|-----|-----|
| `reactflow` | `@xyflow/react` |
| `@reactflow/core` | `@xyflow/react` |
| `@reactflow/background` | `@xyflow/react` (merged) |
| `@reactflow/controls` | `@xyflow/react` (merged) |
| `@reactflow/minimap` | `@xyflow/react` (merged) |
| `@reactflow/node-toolbar` | `@xyflow/react` (merged) |
| `@reactflow/node-resizer` | `@xyflow/react` (merged) |

---

## Node Changes

### parentNode → parentId

```tsx
// v11
const child = { id: 'child', parentNode: 'parent-id', ... };

// v12
const child = { id: 'child', parentId: 'parent-id', ... };
```

### node.width / node.height — Semantics Changed

In v12, `node.width` and `node.height` are now **style constraints** (like inline CSS), not measured values.

**Reading measured dimensions:**

```tsx
// v11 — measured dimensions were directly on node
const width = node.width;
const height = node.height;

// v12 — measured dimensions are in node.measured
const width = node.measured?.width;
const height = node.measured?.height;
```

**Setting fixed dimensions:**

```tsx
// v11 — set via style
const node = { id: '1', style: { width: 180, height: 40 }, ... };

// v12 — can set directly (acts as CSS width/height)
const node = { id: '1', width: 180, height: 40, ... };
// OR via style (also works)
const node = { id: '1', style: { width: 180, height: 40 }, ... };
```

**SSR / static dimensions**: use `node.width` + `node.height` for SSR since dimensions cannot be measured in a non-browser environment.

### NodeProps: xPos/yPos → positionAbsoluteX/Y

```tsx
// v11
function MyNode({ xPos, yPos }: NodeProps) { ... }

// v12
function MyNode({ positionAbsoluteX, positionAbsoluteY }: NodeProps) { ... }
```

---

## Edge Changes

### onEdgeUpdate → onReconnect

Full rename of the edge update/reconnect feature:

| v11 | v12 |
|-----|-----|
| `onEdgeUpdate` | `onReconnect` |
| `onEdgeUpdateStart` | `onReconnectStart` |
| `onEdgeUpdateEnd` | `onReconnectEnd` |
| `updateEdge()` utility | `reconnectEdge()` utility |
| `edge.updatable` | `edge.reconnectable` |
| `edgeUpdaterRadius` prop | `reconnectRadius` prop |
| `edgesUpdatable` prop | `edgesReconnectable` prop |

```tsx
// v11
<ReactFlow
  onEdgeUpdate={onEdgeUpdate}
  onEdgeUpdateStart={onEdgeUpdateStart}
  onEdgeUpdateEnd={onEdgeUpdateEnd}
/>

// v12
<ReactFlow
  onReconnect={onReconnect}
  onReconnectStart={onReconnectStart}
  onReconnectEnd={onReconnectEnd}
/>
```

```tsx
// v11
import { updateEdge } from 'reactflow';
const onEdgeUpdate = (oldEdge, newConn) =>
  setEdges((els) => updateEdge(oldEdge, newConn, els));

// v12
import { reconnectEdge } from '@xyflow/react';
const onReconnect = (oldEdge, newConn) =>
  setEdges((els) => reconnectEdge(oldEdge, newConn, els));
```

---

## API Renames

### Store Internal

```tsx
// v11 — useStore state
const nodeInternals = useStore((s) => s.nodeInternals); // Map<string, Node>

// v12 — renamed to nodeLookup
const nodeLookup = useStore((s) => s.nodeLookup); // Map<string, InternalNode>
```

### ReactFlow Component: Default Export → Named Export

```tsx
// v11
import ReactFlow from 'reactflow'; // default export

// v12
import { ReactFlow } from '@xyflow/react'; // named export
```

---

## Utility Function Renames

| v11 | v12 |
|-----|-----|
| `project(position)` on instance | `screenToFlowPosition(position)` |
| `getRectOfNodes(nodes)` | `getNodesBounds(nodes)` |
| `getTransformForBounds(...)` | `getViewportForBounds(...)` |
| `getNodesBounds(nodes, nodeOrigin)` | `getNodesBounds(nodes, { nodeOrigin })` |

```tsx
// v11
const flowPos = reactFlowInstance.project({ x: 100, y: 200 });
const bounds = getRectOfNodes(nodes);
const transform = getTransformForBounds(bounds, width, height, minZoom, maxZoom);

// v12
const flowPos = reactFlowInstance.screenToFlowPosition({ x: 100, y: 200 });
const bounds = getNodesBounds(nodes);
const viewport = getViewportForBounds(bounds, width, height, minZoom, maxZoom);
```

---

## CSS & Handle Class Changes

Handle CSS class names were simplified:

| v11 | v12 |
|-----|-----|
| `react-flow__handle-connecting` | `connectingto` / `connectingfrom` |
| `react-flow__handle-valid` | `valid` |

Update custom CSS targeting these classes:

```css
/* v11 */
.react-flow__handle.react-flow__handle-connecting { border-color: orange; }
.react-flow__handle.react-flow__handle-valid { border-color: green; }

/* v12 */
.react-flow__handle.connectingto { border-color: orange; }
.react-flow__handle.connectingfrom { border-color: orange; }
.react-flow__handle.valid { border-color: green; }
```

---

## TypeScript Changes

### Improved Generic Typing

v12 introduces better generic support with union types for custom node/edge variants:

```tsx
// v11 — limited typed approach
type NodeData = { label: string } | { value: number };
const nodes: Node<NodeData>[] = [...];

// v12 — discriminated union via second generic
type TextNode = Node<{ text: string }, 'text'>;
type NumberNode = Node<{ value: number }, 'number'>;
type AppNode = TextNode | NumberNode | BuiltInNode;

// Type-safe hook
const { getNodes } = useReactFlow<AppNode, AppEdge>();
// getNodes() returns AppNode[]

// Type guard
function isTextNode(node: AppNode): node is TextNode {
  return node.type === 'text';
}
```

### OnNodesChange / OnEdgesChange Generics

```tsx
// v12 — typed change handlers
const onNodesChange: OnNodesChange<AppNode> = useCallback(
  (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
  []
);
```

### ReactFlowInstance Generic

```tsx
// v11
const instance = useReactFlow();

// v12 — pass node and edge types for fully typed instance
const instance = useReactFlow<AppNode, AppEdge>();
// instance.getNodes() returns AppNode[]
// instance.getEdges() returns AppEdge[]
```

---

## Immutability Requirement

Nodes and edges must be treated as immutable. Never mutate in place.

```tsx
// v11 — mutation worked (discouraged)
setNodes((nodes) => nodes.map((n) => {
  n.hidden = true;  // direct mutation
  return n;
}));

// v12 — MUST spread
setNodes((nodes) => nodes.map((n) => ({
  ...n,
  hidden: true,    // create new object
})));

// Same for edges
setEdges((edges) => edges.map((e) => ({
  ...e,
  animated: true,
})));
```

---

## New Features in v12

### Dark Mode

```tsx
<ReactFlow
  colorMode="dark"     // 'light' | 'dark' | 'system'
  ...
/>
```

### updateNode / updateNodeData (New Methods)

```tsx
const { updateNode, updateNodeData } = useReactFlow();

// Replace entire node (except id and position)
updateNode('node-1', { selected: true, draggable: false });

// Merge-update node data only
updateNodeData('node-1', { label: 'New Label', status: 'done' });

// With functional updater
updateNodeData('node-1', (prev) => ({ ...prev, count: prev.count + 1 }));
```

### useNodeConnections (Replaces useHandleConnections)

```tsx
// v11
import { useHandleConnections } from 'reactflow';
const connections = useHandleConnections({ type: 'target', nodeId: id });

// v12 — new hook (useHandleConnections still works but deprecated)
import { useNodeConnections } from '@xyflow/react';
const connections = useNodeConnections({ handleType: 'target' }); // id auto-inferred
```

### onBeforeDelete (New)

```tsx
// v12 — intercept deletions before they happen
<ReactFlow
  onBeforeDelete={async ({ nodes, edges }) => {
    // Return false to cancel, or filtered arrays to delete subset
    const deletable = nodes.filter((n) => !n.data.isProtected);
    return { nodes: deletable, edges };
  }}
/>
```

### onDelete (New)

```tsx
// v12 — fires AFTER deletion occurs
<ReactFlow
  onDelete={({ nodes, edges }) => {
    console.log('Deleted nodes:', nodes);
    console.log('Deleted edges:', edges);
    // Use for cleanup, undo history, etc.
  }}
/>
```

### Server-Side Rendering Support

v12 properly supports SSR with explicit node dimensions:

```tsx
// Provide dimensions statically for SSR
const nodes = [{
  id: '1',
  position: { x: 0, y: 0 },
  data: { label: 'Node' },
  width: 150,   // no DOM measurement needed
  height: 40,
  handles: [    // pre-define handle positions for SSR
    { id: 'source', type: 'source', position: Position.Bottom, x: 75, y: 40 },
    { id: 'target', type: 'target', position: Position.Top, x: 75, y: 0 },
  ],
}];
```

### isValidConnection — Unified Prop

```tsx
// v12 — single isValidConnection prop works for both onConnect and Handle
<ReactFlow
  isValidConnection={(connection) => {
    return connection.source !== connection.target;
  }}
/>

// OR per-Handle (also works in v12)
<Handle
  type="target"
  position={Position.Left}
  isValidConnection={(connection) => connection.source !== 'blocked-node'}
/>
```

---

## Quick Checklist for v11 → v12 Migration

- [ ] Replace `reactflow` with `@xyflow/react` in all imports
- [ ] Change CSS import to `'@xyflow/react/dist/style.css'`
- [ ] Change `import ReactFlow from 'reactflow'` to `import { ReactFlow } from '@xyflow/react'`
- [ ] Replace `parentNode` with `parentId` on all nodes
- [ ] Update `node.width` / `node.height` reads to `node.measured?.width` / `node.measured?.height`
- [ ] Rename `onEdgeUpdate` → `onReconnect`, `updateEdge` → `reconnectEdge`, etc.
- [ ] Rename `project()` → `screenToFlowPosition()` on ReactFlowInstance
- [ ] Rename `getRectOfNodes()` → `getNodesBounds()`
- [ ] Rename `getTransformForBounds()` → `getViewportForBounds()`
- [ ] Replace `xPos`/`yPos` with `positionAbsoluteX`/`positionAbsoluteY` in NodeProps
- [ ] Update CSS targeting `react-flow__handle-connecting` / `react-flow__handle-valid`
- [ ] Ensure all node/edge updates use spread (no mutation)
- [ ] Replace `nodeInternals` store key with `nodeLookup`
- [ ] Update `getNodesBounds(nodes, nodeOrigin)` → `getNodesBounds(nodes, { nodeOrigin })`
