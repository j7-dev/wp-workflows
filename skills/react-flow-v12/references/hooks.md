# React Flow v12 — Hooks Reference

> TOC: [useReactFlow](#usereactflow) | [useNodesState](#usenodesstate) | [useEdgesState](#useedgesstate) | [useNodes](#usenodes) | [useEdges](#useedges) | [useViewport](#useviewport) | [useConnection](#useconnection) | [useNodeConnections](#usenodeconnections) | [useNodesData](#usenodesdata) | [useNodesInitialized](#usesnodesinitalized) | [useNodeId](#usenodeid) | [useUpdateNodeInternals](#useupdatenodeinternals) | [useOnSelectionChange](#useonselectionchange) | [useOnViewportChange](#useonviewportchange) | [useKeyPress](#usekeypress) | [useStore](#usestore) | [useStoreApi](#usestoreapi) | [useInternalNode](#useinternalnode) | [useHandleConnections (deprecated)](#usehandleconnections)

All hooks must be used inside a component that is a descendant of `<ReactFlow />` or `<ReactFlowProvider />`, unless noted otherwise.

---

## useReactFlow

Returns the `ReactFlowInstance` with all methods for reading and manipulating the flow.

**Does NOT cause re-renders** when state changes — use `useNodes`/`useEdges`/`useViewport` for reactive reads.

```typescript
const instance = useReactFlow<NodeType, EdgeType>();
```

See `references/api-reference.md` `ReactFlowInstance Methods` for all method signatures.

**Common patterns:**

```tsx
import { useReactFlow } from '@xyflow/react';

function MyComponent() {
  const { getNodes, setNodes, addNodes, deleteElements, fitView,
          screenToFlowPosition, updateNodeData } = useReactFlow();

  // Add node at click position
  const handleClick = (e: React.MouseEvent) => {
    addNodes({
      id: `n-${Date.now()}`,
      position: screenToFlowPosition({ x: e.clientX, y: e.clientY }),
      data: { label: 'New' },
    });
  };

  // Update node data immutably
  const handleChange = (nodeId: string, value: string) => {
    updateNodeData(nodeId, { value });
  };

  // Count nodes
  const count = getNodes().length;

  // Animate to fit all nodes
  fitView({ duration: 500, padding: 0.1 });
}
```

---

## useNodesState

Convenience hook for controlled flows. Wraps `useState` + `applyNodeChanges`.

```typescript
function useNodesState<NodeType>(
  initialNodes: NodeType[]
): [nodes: NodeType[], setNodes: Dispatch<SetStateAction<NodeType[]>>, onNodesChange: OnNodesChange<NodeType>]
```

```tsx
import { ReactFlow, useNodesState, useEdgesState, addEdge } from '@xyflow/react';

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = useCallback((p) => setEdges((e) => addEdge(p, e)), []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      />
    </div>
  );
}
```

---

## useEdgesState

Same pattern as `useNodesState` but for edges.

```typescript
function useEdgesState<EdgeType>(
  initialEdges: EdgeType[]
): [edges: EdgeType[], setEdges: Dispatch<SetStateAction<EdgeType[]>>, onEdgesChange: OnEdgesChange<EdgeType>]
```

---

## useNodes

Reactive read of all nodes. Re-renders on any node change.

```typescript
function useNodes<NodeType>(): NodeType[]
```

```tsx
import { useNodes } from '@xyflow/react';

function NodeCount() {
  const nodes = useNodes();
  return <div>{nodes.length} nodes</div>;
}
```

**Performance warning**: Causes re-render on every node change (position, selection, etc.). Use `useStore` with a selector for fine-grained subscriptions.

---

## useEdges

Reactive read of all edges. Re-renders on any edge change.

```typescript
function useEdges<EdgeType>(): EdgeType[]
```

Same performance caveat as `useNodes`.

---

## useViewport

Reactive read of viewport. Re-renders whenever viewport changes (pan/zoom).

```typescript
function useViewport(): { x: number; y: number; zoom: number }
```

```tsx
import { useViewport } from '@xyflow/react';

function ViewportDisplay() {
  const { x, y, zoom } = useViewport();
  return <div>Position: ({x.toFixed(0)}, {y.toFixed(0)}) Zoom: {zoom.toFixed(2)}x</div>;
}
```

---

## useConnection

Returns the current in-progress connection state. All values are `null` when no connection is active.

```typescript
function useConnection<NodeType>(
  selector?: (connection: ConnectionState<InternalNode<NodeType>>) => SelectorReturn
): ConnectionState | SelectorReturn
```

**`ConnectionState` fields:**

| Field | Type | Description |
|-------|------|-------------|
| `inProgress` | `boolean` | Whether a connection drag is happening |
| `isValid` | `boolean \| null` | Validity check result |
| `from` | `XYPosition \| null` | Start position of connection |
| `fromHandle` | `Handle \| null` | Source handle |
| `fromPosition` | `Position \| null` | Source handle position |
| `fromNode` | `InternalNode \| null` | Source node |
| `to` | `XYPosition \| null` | Current cursor position |
| `toHandle` | `Handle \| null` | Target handle (when hovering) |
| `toPosition` | `Position \| null` | Target handle position |
| `toNode` | `InternalNode \| null` | Target node (when hovering) |

```tsx
import { useConnection } from '@xyflow/react';

// Use in custom Handle to colorize based on connection validity
function CustomHandle() {
  const connection = useConnection();
  const isTarget = connection.inProgress && connection.fromNode?.id !== 'this-node-id';

  return (
    <Handle
      type="target"
      position={Position.Left}
      style={{ background: isTarget ? (connection.isValid ? 'green' : 'red') : undefined }}
    />
  );
}
```

---

## useNodeConnections

Returns connections on a node (replaces deprecated `useHandleConnections`).

```typescript
function useNodeConnections(options?: {
  id?: string;               // Node ID (auto from context if inside custom node)
  handleType?: 'source' | 'target';
  handleId?: string;         // For nodes with multiple handles of same type
  onConnect?: (connections: HandleConnection[]) => void;
  onDisconnect?: (connections: HandleConnection[]) => void;
}): NodeConnection[]
```

```tsx
import { useNodeConnections } from '@xyflow/react';

// Inside a custom node — id auto-inferred from NodeIdContext
function CustomNode() {
  const connections = useNodeConnections({ handleType: 'target' });
  return <div>{connections.length} incoming connections</div>;
}

// Outside node — must pass id
function SomeOtherComponent({ nodeId }) {
  const connections = useNodeConnections({ id: nodeId, handleType: 'source' });
  return <div>{connections.length} outgoing from {nodeId}</div>;
}
```

---

## useNodesData

Subscribe to specific node(s) data. More efficient than `useNodes` when you only need data for certain nodes.

```typescript
// Single node
function useNodesData<NodeType>(nodeId: string): Pick<NodeType, 'id' | 'type' | 'data'> | null

// Multiple nodes
function useNodesData<NodeType>(nodeIds: string[]): Pick<NodeType, 'id' | 'type' | 'data'>[]
```

```tsx
import { useNodesData } from '@xyflow/react';

// Subscribes to one node's data only
function DataDisplay({ nodeId }: { nodeId: string }) {
  const nodeData = useNodesData(nodeId);
  if (!nodeData) return null;
  return <pre>{JSON.stringify(nodeData.data, null, 2)}</pre>;
}

// TypeScript with custom types
type MyNode = Node<{ value: number }, 'myNode'>;
const nodesData = useNodesData<MyNode>(['node-1', 'node-2']);
```

---

## useNodesInitialized

Returns `true` when all nodes have been measured (have `width` and `height`). Useful for triggering layouts after initial render.

```typescript
function useNodesInitialized(options?: {
  includeHiddenNodes?: boolean  // default: false
}): boolean
```

```tsx
import { useNodesInitialized, useReactFlow } from '@xyflow/react';
import { useEffect } from 'react';

function useLayoutOnInit() {
  const nodesInitialized = useNodesInitialized();
  const { getNodes, setNodes } = useReactFlow();

  useEffect(() => {
    if (nodesInitialized) {
      const layouted = runYourLayout(getNodes());
      setNodes(layouted);
    }
  }, [nodesInitialized]);
}
```

Always returns `false` if the nodes array is empty.

---

## useNodeId

Returns the ID of the node that wraps the current component. Use for prop drilling avoidance inside deep custom node trees.

```typescript
function useNodeId(): string | null
```

```tsx
import { useNodeId } from '@xyflow/react';

// Deeply nested child inside a custom node
function DeepChild() {
  const nodeId = useNodeId();  // Gets the parent node's ID without prop drilling
  const { updateNodeData } = useReactFlow();

  return (
    <button onClick={() => updateNodeData(nodeId!, { updated: true })}>
      Update
    </button>
  );
}
```

Only works inside custom node components and their descendants.

---

## useUpdateNodeInternals

Returns a function to notify React Flow when handles change programmatically.

```typescript
function useUpdateNodeInternals(): (nodeId: string | string[]) => void
```

**Call this after:**
- Dynamically adding/removing Handle components from a node
- Changing handle positions programmatically

```tsx
import { Handle, useUpdateNodeInternals } from '@xyflow/react';
import { useState, useCallback } from 'react';

function DynamicHandleNode({ id }) {
  const updateNodeInternals = useUpdateNodeInternals();
  const [handleCount, setHandleCount] = useState(2);

  const addHandle = useCallback(() => {
    setHandleCount((c) => c + 1);
    updateNodeInternals(id);  // Must call after state update
  }, [id, updateNodeInternals]);

  return (
    <>
      {Array.from({ length: handleCount }, (_, i) => (
        <Handle key={i} type="source" position={Position.Right} id={`handle-${i}`} />
      ))}
      <button onClick={addHandle}>Add Handle</button>
    </>
  );
}
```

---

## useOnSelectionChange

Subscribe to node/edge selection changes. The `onChange` handler must be memoized.

```typescript
function useOnSelectionChange<NodeType, EdgeType>(options: {
  onChange: (params: { nodes: NodeType[]; edges: EdgeType[] }) => void
}): void
```

```tsx
import { useOnSelectionChange } from '@xyflow/react';
import { useState, useCallback } from 'react';

function SelectionTracker() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // MUST memoize with useCallback
  const onChange = useCallback(({ nodes, edges }) => {
    setSelectedIds([...nodes.map((n) => n.id), ...edges.map((e) => e.id)]);
  }, []);

  useOnSelectionChange({ onChange });

  return <div>Selected: {selectedIds.join(', ')}</div>;
}
```

---

## useOnViewportChange

Listen to viewport pan/zoom events.

```typescript
function useOnViewportChange(callbacks: {
  onStart?: (viewport: Viewport) => void;
  onChange?: (viewport: Viewport) => void;
  onEnd?: (viewport: Viewport) => void;
}): void
```

```tsx
import { useOnViewportChange } from '@xyflow/react';

function ViewportLogger() {
  useOnViewportChange({
    onStart: (v) => console.log('Pan/zoom started', v),
    onChange: (v) => console.log('Panning/zooming', v),
    onEnd: (v) => console.log('Pan/zoom ended', v),
  });
  return null;
}
```

---

## useKeyPress

Detect key combinations. Works anywhere — does not require ReactFlowProvider context.

```typescript
function useKeyPress(
  keyCode: KeyCode | null,
  options?: {
    target?: Window | Document | HTMLElement | ShadowRoot | null;  // default: document
    actInsideInputWithModifier?: boolean;  // default: true
    preventDefault?: boolean;
  }
): boolean
```

`KeyCode` = string | string[] — single key (`'a'`), combo (`'Meta+s'`), or array (`['Meta+s', 'Ctrl+s']`)

```tsx
import { useKeyPress } from '@xyflow/react';

function KeyboardShortcuts() {
  const spacePressed = useKeyPress('Space');
  const savePressed = useKeyPress(['Meta+s', 'Ctrl+s']);
  const deletePressed = useKeyPress(['Delete', 'Backspace']);

  useEffect(() => {
    if (savePressed) handleSave();
  }, [savePressed]);

  return spacePressed ? <div>Space held</div> : null;
}
```

---

## useStore

Low-level Zustand store subscription. Re-exports from Zustand.

```typescript
function useStore<StateSlice>(
  selector: (state: ReactFlowState) => StateSlice,
  equalityFn?: (a: StateSlice, b: StateSlice) => boolean
): StateSlice
```

**Use when**: you need reactive access to internal state not exposed by other hooks.

```tsx
import { useStore } from '@xyflow/react';

// Only re-renders when node count changes
const nodesLengthSelector = (state) => state.nodes.length;
function NodeCounter() {
  const count = useStore(nodesLengthSelector);  // selector defined OUTSIDE component
  return <div>{count} nodes</div>;
}

// TypeScript with custom types
const nodes = useStore((s: ReactFlowState<CustomNodeType>) => s.nodes);

// Set internal state (e.g., min zoom)
function MinZoomSetter() {
  const setMinZoom = useStore((s) => s.setMinZoom);
  return <button onClick={() => setMinZoom(0.1)}>Set Min Zoom</button>;
}
```

---

## useStoreApi

Returns the Zustand store API for imperative access (no subscription/re-render).

```typescript
function useStoreApi(): StoreApi<ReactFlowState>
```

```tsx
import { useStoreApi } from '@xyflow/react';

function ImmperativeComponent() {
  const store = useStoreApi();

  const handleClick = () => {
    const { nodes, edges } = store.getState();
    console.log(nodes, edges);  // read without triggering re-render
  };
}
```

---

## useInternalNode

Returns the internal representation of a node (includes `internals.positionAbsolute`).

```typescript
function useInternalNode<NodeType>(id: string): InternalNode<NodeType> | undefined
```

`InternalNode` includes:
- All `Node` fields
- `internals.positionAbsolute: { x: number; y: number }` — absolute position (for sub-flow children)
- `internals.z: number` — z-index
- `internals.handleBounds` — handle positions

```tsx
import { useInternalNode } from '@xyflow/react';

function NodePositionDisplay({ nodeId }) {
  const internalNode = useInternalNode(nodeId);
  if (!internalNode) return null;

  const { x, y } = internalNode.internals.positionAbsolute;
  return <div>Absolute position: ({x.toFixed(0)}, {y.toFixed(0)})</div>;
}
```

---

## useHandleConnections

**Deprecated** — use `useNodeConnections` instead.

```typescript
function useHandleConnections(options: {
  type: 'source' | 'target';
  id?: string | null;
  nodeId?: string;
  onConnect?: (connections: Connection[]) => void;
  onDisconnect?: (connections: Connection[]) => void;
}): HandleConnection[]
```
