---
name: react-flow-v12
description: >
  Complete API reference for @xyflow/react (React Flow) v12+. Use this skill
  whenever any task involves @xyflow/react, ReactFlow, node-based UI, flow
  diagrams, DAG visualization, graph editors, workflow builders, canvas editors,
  or any code importing from '@xyflow/react'. Covers ReactFlow component props,
  useReactFlow hook, useNodes, useEdges, useNodesState, useEdgesState,
  useConnection, useViewport, useNodeId, useHandleConnections,
  useNodeConnections, useNodesData, useNodesInitialized, useOnSelectionChange,
  useOnViewportChange, useUpdateNodeInternals, useKeyPress, useStore,
  useStoreApi, useInternalNode hooks; Background, Controls, MiniMap, Panel,
  Handle, NodeToolbar, NodeResizer, EdgeLabelRenderer, EdgeToolbar, BaseEdge,
  EdgeText, ViewportPortal components; addEdge, applyNodeChanges,
  applyEdgeChanges, getBezierPath, getSmoothStepPath, getStraightPath,
  getSimpleBezierPath, getConnectedEdges, getIncomers, getOutgoers,
  getNodesBounds, getViewportForBounds, reconnectEdge, isNode, isEdge utils;
  Node, Edge, NodeProps, EdgeProps, Connection, Viewport, NodeChange,
  EdgeChange, ReactFlowInstance types; custom node development, custom edge
  development, Handle placement, dagre layout, ELK layout, sub-flows, parentId,
  onNodesChange, onEdgesChange, onConnect, onBeforeDelete patterns, controlled
  vs uncontrolled flow, SSR, TypeScript generics, colorMode, dark mode.
  Do not use web search — all needed information is in this skill's references.
---

# @xyflow/react (React Flow) v12

> **Package**: `@xyflow/react` v12+ | **Docs**: https://reactflow.dev | **Updated**: 2026-03-17

React Flow is a library for building node-based UIs — flow diagrams, DAGs, workflow editors, canvas tools. It manages node/edge state, viewport, drag/drop, connections, and selection. You render nodes and edges; React Flow handles interaction.

## Installation & Required CSS

```bash
npm install @xyflow/react
```

```tsx
// CSS is REQUIRED — without it the flow breaks visually
import '@xyflow/react/dist/style.css';
```

## Minimal Working Example

```tsx
import { useState, useCallback } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
];
const initialEdges = [{ id: 'n1-n2', source: 'n1', target: 'n2' }];

export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []
  );
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)), []
  );

  // REQUIRED: parent div must have explicit width AND height
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      />
    </div>
  );
}
```

**Convenience shortcut** — `useNodesState` / `useEdgesState` wrap useState + applyChanges:

```tsx
import { ReactFlow, useNodesState, useEdgesState, addEdge } from '@xyflow/react';

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback((p) => setEdges((e) => addEdge(p, e)), []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect} fitView>
        <Background /> <Controls /> <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Node** | Element with `id`, `position: {x,y}`, `data`, optional `type`. Parent div must be sized. |
| **Edge** | Connection with `id`, `source`, `target` (node IDs), optional `sourceHandle`/`targetHandle`. |
| **Handle** | Connection point on a node. `type: 'source'` or `type: 'target'`. Multiple handles need unique `id`. |
| **Viewport** | `{x, y, zoom}` — position + zoom of the canvas. Manipulate via `useReactFlow()`. |
| **Controlled flow** | You manage `nodes`/`edges` state via `useState` + `onNodesChange`/`onEdgesChange`. |
| **Uncontrolled flow** | Use `defaultNodes`/`defaultEdges`; React Flow manages state internally. Modify via `useReactFlow()`. |

## Most-Used APIs Quick Reference

### ReactFlow Component (key props)

```tsx
<ReactFlow
  // Data
  nodes={nodes}                    // Node[]
  edges={edges}                    // Edge[]
  nodeTypes={nodeTypes}            // { typeName: Component } — define OUTSIDE component or useMemo!
  edgeTypes={edgeTypes}            // { typeName: Component } — same warning

  // Event handlers
  onNodesChange={onNodesChange}    // (changes: NodeChange[]) => void
  onEdgesChange={onEdgesChange}    // (changes: EdgeChange[]) => void
  onConnect={onConnect}            // (connection: Connection) => void
  onBeforeDelete={onBeforeDelete}  // async (params) => boolean | {nodes,edges}
  onInit={(instance) => {}}        // called once with ReactFlowInstance

  // Viewport
  fitView                          // auto-fit all nodes on mount
  fitViewOptions={{ padding: 0.1, duration: 500 }}
  defaultViewport={{ x: 0, y: 0, zoom: 1 }}
  minZoom={0.1}  maxZoom={4}

  // Interaction
  nodesDraggable={true}
  nodesConnectable={true}
  elementsSelectable={true}
  selectionMode="full"             // 'full' | 'partial'
  selectionOnDrag={false}          // drag-select without Shift key
  panOnDrag={true}
  panOnScroll={false}
  zoomOnScroll={true}
  connectOnClick={true}
  connectionMode="strict"          // 'strict' | 'loose'
  isValidConnection={fn}           // (connection) => boolean

  // Keys
  deleteKeyCode="Backspace"
  multiSelectionKeyCode="Meta"     // Cmd/Ctrl for multi-select

  // Appearance
  colorMode="light"                // 'light' | 'dark' | 'system'
  snapToGrid={false}
  snapGrid={[15, 15]}
  defaultEdgeOptions={{ animated: true, type: 'smoothstep' }}

  // SSR
  width={1000} height={600}        // needed for SSR/static rendering
/>
```

### useReactFlow() — Most Important Hook

```tsx
const {
  // Read
  getNodes, getEdges, getNode, getEdge,
  // Write
  setNodes, setEdges, addNodes, addEdges,
  updateNode, updateNodeData, updateEdge, updateEdgeData,
  deleteElements,
  // Viewport
  fitView, zoomIn, zoomOut, zoomTo, setViewport, getViewport, getZoom,
  setCenter, fitBounds,
  // Coordinates
  screenToFlowPosition, flowToScreenPosition,
  // Other
  toObject,
  viewportInitialized,  // boolean — true after DOM init
} = useReactFlow();
```

Key patterns:

```tsx
// Add a node at cursor position
const { screenToFlowPosition, addNodes } = useReactFlow();
const onPaneClick = useCallback((e) => {
  addNodes({
    id: `node-${Date.now()}`,
    position: screenToFlowPosition({ x: e.clientX, y: e.clientY }),
    data: { label: 'New node' },
  });
}, [screenToFlowPosition, addNodes]);

// Delete elements programmatically
const { deleteElements } = useReactFlow();
deleteElements({ nodes: [{ id: 'node-1' }], edges: [{ id: 'edge-1' }] });

// Update node data
const { updateNodeData } = useReactFlow();
updateNodeData('node-1', { value: 42 });

// Fit view to specific nodes
fitView({ nodes: [{ id: 'n1' }, { id: 'n2' }], duration: 500, padding: 0.2 });
```

### Custom Node

```tsx
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

// TypeScript: define your data shape
type MyNodeData = { label: string; color?: string };
type MyNode = Node<MyNodeData, 'myNode'>;

// Component receives NodeProps
function MyCustomNode({ id, data, selected, isConnectable }: NodeProps<MyNode>) {
  return (
    <div style={{ background: data.color, padding: 10, border: selected ? '2px solid blue' : '1px solid #ccc' }}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
}

// CRITICAL: define nodeTypes OUTSIDE component (or useMemo) to avoid re-render loops
const nodeTypes = { myNode: MyCustomNode };

// Use
<ReactFlow nodeTypes={nodeTypes} nodes={[
  { id: '1', type: 'myNode', position: { x: 0, y: 0 }, data: { label: 'Hi' } }
]} ... />
```

### Custom Edge

```tsx
import { getBezierPath, BaseEdge, EdgeLabelRenderer, type EdgeProps, type Edge } from '@xyflow/react';

type MyEdge = Edge<{ label: string }, 'myEdge'>;

function MyCustomEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data,
}: EdgeProps<MyEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <div style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          pointerEvents: 'all',
        }} className="nodrag nopan">
          {data?.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = { myEdge: MyCustomEdge };
```

## Important CSS Classes

| Class | Purpose |
|-------|---------|
| `nodrag` | Prevents drag on element inside node (e.g., inputs, buttons) |
| `nopan` | Prevents panning when interacting with element |
| `nowheel` | Prevents zoom when scrolling over element |

Use `visibility: hidden` or `opacity: 0` to hide handles — never `display: none`.

## Critical Pitfalls

1. **Missing CSS**: Import `@xyflow/react/dist/style.css` or the flow breaks.
2. **Missing container height**: Parent must have explicit `width` AND `height`.
3. **nodeTypes/edgeTypes inside component**: Creates new object each render → re-render loop. Define outside or use `useMemo`.
4. **Mutating nodes directly**: Always create new objects (`{ ...node, hidden: true }`).
5. **useReactFlow outside provider**: Wrap with `<ReactFlowProvider>` or use inside `<ReactFlow>` children.
6. **Multiple handles without IDs**: Give each handle a unique `id` prop.
7. **updateNodeInternals**: Call after programmatically adding/removing handles.

## References Guide

| Need | File |
|------|------|
| Full ReactFlow prop list + all event handlers | `references/api-reference.md` |
| All hooks with complete signatures | `references/hooks.md` |
| Background, Controls, MiniMap, Panel, NodeToolbar, NodeResizer | `references/components.md` |
| Node, Edge, Connection, Viewport type definitions | `references/types.md` |
| addEdge, getBezierPath, getIncomers, getOutgoers, etc. | `references/utils.md` |
| Custom node/edge patterns, Handle usage, patterns | `references/custom-nodes-edges.md` |
| Dagre, ELK, d3-hierarchy layouts + sub-flows | `references/layouting.md` |
| Full executable examples (add node, delete, validate, etc.) | `references/examples.md` |
| v11→v12 breaking changes, renamed APIs | `references/migration-v12.md` |
