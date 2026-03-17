# React Flow v12 — Complete Examples

> TOC: [Minimal Controlled Flow](#minimal-controlled-flow) | [Add Node on Click](#add-node-on-click) | [Delete with Confirmation](#delete-with-confirmation) | [Connection Validation](#connection-validation) | [Save & Restore](#save--restore) | [Custom Node with Toolbar](#custom-node-with-toolbar) | [Resizable Node](#resizable-node) | [Dagre Auto-Layout](#dagre-auto-layout) | [Sub-Flow Container](#sub-flow-container) | [SSR Configuration](#ssr-configuration) | [TypeScript Full App](#typescript-full-app)

All examples are complete and self-contained. Copy and run as-is.

---

## Minimal Controlled Flow

The absolute minimum to get a working interactive flow.

```tsx
import { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 200, y: 100 }, data: { label: 'Node 2' } },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
```

---

## Add Node on Click

Click anywhere on the canvas to add a new node at that position.

```tsx
import { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Background,
  type MouseEvent as FlowMouseEvent,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

let id = 1;
const getId = () => `node-${id++}`;

export default function AddNodeOnClick() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();

  const onPaneClick = useCallback(
    (event: FlowMouseEvent) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      setNodes((nds) => [
        ...nds,
        {
          id: getId(),
          position,
          data: { label: `Node ${id}` },
          // New node appears centered on click position
          origin: [0.5, 0.5],
        },
      ]);
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={onPaneClick}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
```

---

## Delete with Confirmation

Intercept deletion events and show a confirmation dialog before deleting.

```tsx
import { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  type OnBeforeDelete,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Protected Node', isProtected: true } },
  { id: '2', position: { x: 200, y: 100 }, data: { label: 'Deletable Node' } },
];

export default function DeleteWithConfirmation() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  // onBeforeDelete MUST be async
  const onBeforeDelete: OnBeforeDelete = useCallback(async ({ nodes, edges }) => {
    // Filter out protected nodes
    const deletableNodes = nodes.filter((n) => !n.data.isProtected);
    const deletableEdges = edges.filter((e) => {
      // Keep edges only if their connected nodes are also deleted
      return true;
    });

    if (deletableNodes.length < nodes.length) {
      // Optionally show a message
      console.log('Some nodes are protected and cannot be deleted');
    }

    // Return the filtered subset to delete
    return { nodes: deletableNodes, edges: deletableEdges };

    // OR: return false to cancel all deletion
    // return false;

    // OR: show confirm dialog
    // const confirmed = await confirm('Delete selected items?');
    // return confirmed;
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onBeforeDelete={onBeforeDelete}
        fitView
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
```

---

## Connection Validation

Prevent invalid connections (same source type → target type only, no self-loops, max connections).

```tsx
import { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  Background,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  type IsValidConnection,
} from '@xyflow/react';
import { memo } from 'react';
import '@xyflow/react/dist/style.css';

type TypedNode = Node<{ type: 'input' | 'process' | 'output'; label: string }, 'typed'>;

const TypedNodeComponent = memo(function TypedNode({ data, selected }: NodeProps<TypedNode>) {
  // isValidConnection on Handle: per-handle validation
  const isValidTarget: IsValidConnection = (connection) => {
    // No self-connections
    if (connection.source === connection.target) return false;
    // Only 'input' type can connect to 'process' (requires source node data — use global validation instead)
    return true;
  };

  return (
    <div
      style={{
        background: { input: '#6ede87', process: '#6865a5', output: '#ff0072' }[data.type],
        padding: '10px 20px',
        borderRadius: 8,
        border: selected ? '2px solid #000' : '2px solid transparent',
        color: 'white',
        fontWeight: 'bold',
      }}
    >
      {data.type !== 'input' && (
        <Handle
          type="target"
          position={Position.Top}
          isValidConnection={isValidTarget}
        />
      )}
      {data.label}
      {data.type !== 'output' && (
        <Handle type="source" position={Position.Bottom} />
      )}
    </div>
  );
});

const nodeTypes = { typed: TypedNodeComponent };

const initialNodes: TypedNode[] = [
  { id: '1', type: 'typed', position: { x: 100, y: 0 }, data: { type: 'input', label: 'Input' } },
  { id: '2', type: 'typed', position: { x: 100, y: 150 }, data: { type: 'process', label: 'Process' } },
  { id: '3', type: 'typed', position: { x: 100, y: 300 }, data: { type: 'output', label: 'Output' } },
];

export default function ValidationFlow() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Global connection validation — has access to all nodes/edges
  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      // No self-loops
      if (connection.source === connection.target) return false;

      // No duplicate edges
      const duplicate = edges.some(
        (e) =>
          e.source === connection.source &&
          e.target === connection.target &&
          e.sourceHandle === connection.sourceHandle &&
          e.targetHandle === connection.targetHandle
      );
      if (duplicate) return false;

      // Check node types
      const sourceNode = nodes.find((n) => n.id === connection.source) as TypedNode;
      const targetNode = nodes.find((n) => n.id === connection.target) as TypedNode;
      if (!sourceNode || !targetNode) return false;

      // input → process allowed, process → output allowed, others blocked
      const allowed = [
        ['input', 'process'],
        ['process', 'output'],
      ];
      return allowed.some(
        ([from, to]) => sourceNode.data.type === from && targetNode.data.type === to
      );
    },
    [nodes, edges]
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        fitView
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
```

---

## Save & Restore

Serialize the flow to JSON and restore it.

```tsx
import { useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  Background,
  Controls,
  Panel,
  type Node,
  type Edge,
  type Connection,
  type ReactFlowJsonObject,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const STORAGE_KEY = 'react-flow-snapshot';

const initialNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
];

function FlowWithSaveRestore() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { toObject, setViewport } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onSave = useCallback(() => {
    const flow: ReactFlowJsonObject = toObject();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flow));
    console.log('Saved:', flow);
  }, [toObject]);

  const onRestore = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const flow: ReactFlowJsonObject = JSON.parse(stored);
    const { x = 0, y = 0, zoom = 1 } = flow.viewport ?? {};

    setNodes(flow.nodes || []);
    setEdges(flow.edges || []);
    setViewport({ x, y, zoom });
  }, [setNodes, setEdges, setViewport]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
    >
      <Background />
      <Controls />
      <Panel position="top-right">
        <button onClick={onSave} style={{ marginRight: 8 }}>Save</button>
        <button onClick={onRestore}>Restore</button>
      </Panel>
    </ReactFlow>
  );
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <FlowWithSaveRestore />
      </ReactFlowProvider>
    </div>
  );
}
```

---

## Custom Node with Toolbar

Custom node with a NodeToolbar showing actions when selected.

```tsx
import { memo } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeToolbar,
  Background,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

type CardNodeData = { label: string; description: string };
type CardNode = Node<CardNodeData, 'card'>;

const CardNodeComponent = memo(function CardNode({
  id,
  data,
  selected,
  isConnectable,
}: NodeProps<CardNode>) {
  const handleDelete = () => {
    // Use deleteElements from useReactFlow in a real app
    console.log('Delete node:', id);
  };

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <button onClick={() => console.log('Edit', id)}>Edit</button>
        <button onClick={handleDelete} style={{ color: 'red' }}>Delete</button>
        <button onClick={() => console.log('Duplicate', id)}>Copy</button>
      </NodeToolbar>

      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />

      <div
        style={{
          padding: '12px 16px',
          background: 'white',
          border: `2px solid ${selected ? '#0041d0' : '#ddd'}`,
          borderRadius: 8,
          minWidth: 180,
          boxShadow: selected ? '0 4px 12px rgba(0,65,208,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{data.label}</div>
        <div style={{ fontSize: 12, color: '#666' }}>{data.description}</div>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </>
  );
});

// MUST be defined outside component or useMemo to prevent re-renders
const nodeTypes = { card: CardNodeComponent };

const initialNodes: CardNode[] = [
  { id: '1', type: 'card', position: { x: 0, y: 0 }, data: { label: 'Start', description: 'Entry point' } },
  { id: '2', type: 'card', position: { x: 0, y: 200 }, data: { label: 'Process', description: 'Main logic' } },
];

export default function CustomNodeWithToolbar() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState([]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
```

---

## Resizable Node

Custom node with resize handles.

```tsx
import { memo } from 'react';
import {
  ReactFlow,
  useNodesState,
  Handle,
  Position,
  NodeResizer,
  Background,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

type ResizableNodeData = { label: string };
type ResizableNode = Node<ResizableNodeData, 'resizable'>;

const ResizableNodeComponent = memo(function ResizableNode({
  data,
  selected,
}: NodeProps<ResizableNode>) {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={100}
        minHeight={40}
        // Handlers fire during resize
        onResize={(_, { width, height }) => {
          console.log('Resizing to:', width, height);
        }}
      />

      <Handle type="target" position={Position.Top} />

      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
          border: `2px solid ${selected ? '#0041d0' : '#ddd'}`,
          borderRadius: 6,
          padding: 8,
        }}
      >
        {data.label}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </>
  );
});

const nodeTypes = { resizable: ResizableNodeComponent };

const initialNodes: ResizableNode[] = [
  {
    id: '1',
    type: 'resizable',
    position: { x: 100, y: 100 },
    data: { label: 'Drag my edges to resize' },
    style: { width: 200, height: 80 },  // initial size via style
  },
];

export default function ResizableNodeExample() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow nodes={nodes} onNodesChange={onNodesChange} nodeTypes={nodeTypes} fitView>
        <Background />
      </ReactFlow>
    </div>
  );
}
```

---

## Dagre Auto-Layout

Full dagre layout with direction toggle.

```tsx
import { useCallback } from 'react';
import dagre from '@dagrejs/dagre';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  Panel,
  Position,
  ConnectionLineType,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'TB') {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });
  nodes.forEach((n) => dagreGraph.setNode(n.id, { width: nodeWidth, height: nodeHeight }));
  edges.forEach((e) => dagreGraph.setEdge(e.source, e.target));
  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map((n) => {
      const pos = dagreGraph.node(n.id);
      return {
        ...n,
        targetPosition: isHorizontal ? Position.Left : Position.Top,
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 },
      };
    }),
    edges,
  };
}

const rawNodes: Node[] = [
  { id: '1', data: { label: 'Root' }, position: { x: 0, y: 0 } },
  { id: '2', data: { label: 'Branch A' }, position: { x: 0, y: 0 } },
  { id: '3', data: { label: 'Branch B' }, position: { x: 0, y: 0 } },
  { id: '4', data: { label: 'Leaf 1' }, position: { x: 0, y: 0 } },
  { id: '5', data: { label: 'Leaf 2' }, position: { x: 0, y: 0 } },
];
const rawEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'smoothstep' },
  { id: 'e1-3', source: '1', target: '3', type: 'smoothstep' },
  { id: 'e2-4', source: '2', target: '4', type: 'smoothstep' },
  { id: 'e3-5', source: '3', target: '5', type: 'smoothstep' },
];

const { nodes: initNodes, edges: initEdges } = getLayoutedElements(rawNodes, rawEdges);

export default function DagreLayout() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, type: ConnectionLineType.SmoothStep, animated: true }, eds)
      ),
    []
  );
  const onLayout = useCallback(
    (direction: string) => {
      const { nodes: ln, edges: le } = getLayoutedElements(nodes, edges, direction);
      setNodes([...ln]);
      setEdges([...le]);
    },
    [nodes, edges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
      >
        <Background />
        <Controls />
        <Panel position="top-right">
          <button onClick={() => onLayout('TB')}>Vertical</button>
          <button onClick={() => onLayout('LR')}>Horizontal</button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
```

---

## Sub-Flow Container

Nodes grouped inside a parent container node.

```tsx
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// IMPORTANT: parent nodes MUST appear before children in array
const initialNodes: Node[] = [
  // Parent container — 'group' type has no handles
  {
    id: 'group-1',
    type: 'group',
    position: { x: 50, y: 50 },
    style: {
      width: 300,
      height: 200,
      backgroundColor: 'rgba(100, 150, 230, 0.1)',
      border: '2px dashed #6496e6',
      borderRadius: 8,
    },
    data: {},
  },
  // Children — position relative to parent
  {
    id: 'child-a',
    position: { x: 30, y: 60 },
    parentId: 'group-1',
    extent: 'parent',   // constrained to parent bounds
    data: { label: 'Child A' },
  },
  {
    id: 'child-b',
    position: { x: 180, y: 60 },
    parentId: 'group-1',
    extent: 'parent',
    data: { label: 'Child B' },
  },
  // External node
  {
    id: 'external',
    position: { x: 450, y: 100 },
    data: { label: 'External' },
  },
];

const initialEdges: Edge[] = [
  // Internal edge (within sub-flow)
  { id: 'e-ab', source: 'child-a', target: 'child-b', type: 'smoothstep' },
  // Cross-boundary edge
  { id: 'e-b-ext', source: 'child-b', target: 'external', type: 'smoothstep' },
];

export default function SubFlowExample() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
```

---

## SSR Configuration

React Flow with Next.js App Router or any SSR environment.

```tsx
// For SSR: provide initial width/height on nodes, set container dimensions
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Nodes need width/height for SSR (can't measure DOM)
const ssrNodes: Node[] = [
  {
    id: '1',
    position: { x: 0, y: 0 },
    data: { label: 'SSR Node 1' },
    width: 150,    // provide static dimensions
    height: 40,
  },
  {
    id: '2',
    position: { x: 200, y: 100 },
    data: { label: 'SSR Node 2' },
    width: 150,
    height: 40,
  },
];

const ssrEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
];

// In Next.js, use dynamic import to prevent SSR of the flow canvas:
// const ReactFlowCanvas = dynamic(() => import('./FlowCanvas'), { ssr: false });

export default function SSRFlow() {
  return (
    // Container MUST have explicit dimensions
    <div style={{ width: '800px', height: '600px' }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={ssrNodes}
          edges={ssrEdges}
          // proOptions={{ hideAttribution: true }}  // Pro feature
          fitView
        >
          <Background />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

// Next.js App Router — page.tsx
// 'use client';  // ReactFlow requires client component
// import dynamic from 'next/dynamic';
// const Flow = dynamic(() => import('./Flow'), { ssr: false });
// export default function Page() { return <Flow />; }
```

---

## TypeScript Full App

Production-ready typed React Flow application.

```tsx
import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Panel,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  type Connection,
  type OnBeforeDelete,
  type BuiltInNode,
  type BuiltInEdge,
  type NodeProps,
  type EdgeProps,
  Handle,
  Position,
  BaseEdge,
  getBezierPath,
} from '@xyflow/react';
import { memo } from 'react';
import '@xyflow/react/dist/style.css';

// ---- Types ----

type TaskData = { label: string; status: 'pending' | 'running' | 'done' | 'error' };
type TaskNode = Node<TaskData, 'task'>;

type FlowEdgeData = { label?: string };
type FlowEdge = Edge<FlowEdgeData, 'flow'>;

type AppNode = BuiltInNode | TaskNode;
type AppEdge = BuiltInEdge | FlowEdge;

// ---- Custom Node ----

const statusColors = {
  pending: '#e0e0e0',
  running: '#fff3cd',
  done: '#d4edda',
  error: '#f8d7da',
} as const;

const TaskNodeComponent = memo(function TaskNode({ data, selected }: NodeProps<TaskNode>) {
  return (
    <div
      style={{
        background: statusColors[data.status],
        border: `2px solid ${selected ? '#0041d0' : '#ccc'}`,
        borderRadius: 8,
        padding: '10px 16px',
        minWidth: 140,
        fontSize: 13,
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ fontWeight: 600 }}>{data.label}</div>
      <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{data.status}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

// ---- Custom Edge ----

const FlowEdgeComponent = memo(function FlowEdge({
  id, sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  data, selected, markerEnd,
}: EdgeProps<FlowEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      label={data?.label}
      labelX={labelX}
      labelY={labelY}
      style={{ stroke: selected ? '#0041d0' : '#b1b1b7', strokeWidth: 2 }}
    />
  );
});

// ---- nodeTypes / edgeTypes MUST be stable ----

const nodeTypes: NodeTypes = { task: TaskNodeComponent };
const edgeTypes: EdgeTypes = { flow: FlowEdgeComponent };

// ---- Initial Data ----

const initialNodes: TaskNode[] = [
  { id: '1', type: 'task', position: { x: 200, y: 0 }, data: { label: 'Fetch Data', status: 'done' } },
  { id: '2', type: 'task', position: { x: 100, y: 150 }, data: { label: 'Validate', status: 'running' } },
  { id: '3', type: 'task', position: { x: 300, y: 150 }, data: { label: 'Transform', status: 'pending' } },
  { id: '4', type: 'task', position: { x: 200, y: 300 }, data: { label: 'Save', status: 'pending' } },
];
const initialEdges: FlowEdge[] = [
  { id: 'e1-2', type: 'flow', source: '1', target: '2', data: { label: 'on success' } },
  { id: 'e1-3', type: 'flow', source: '1', target: '3', data: {} },
  { id: 'e2-4', type: 'flow', source: '2', target: '4', data: {} },
  { id: 'e3-4', type: 'flow', source: '3', target: '4', data: {} },
];

// ---- Main Flow Component ----

function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<TaskNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>(initialEdges);
  const { toObject } = useReactFlow<TaskNode, FlowEdge>();

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, type: 'flow', data: {} }, eds)),
    []
  );

  const onBeforeDelete: OnBeforeDelete<TaskNode, FlowEdge> = useCallback(
    async ({ nodes, edges }) => {
      // Don't delete running nodes
      const deletableNodes = nodes.filter((n) => n.data.status !== 'running');
      return { nodes: deletableNodes, edges };
    },
    []
  );

  const onSave = useCallback(() => {
    const snapshot = toObject();
    localStorage.setItem('flow', JSON.stringify(snapshot));
  }, [toObject]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onBeforeDelete={onBeforeDelete}
      colorMode="system"
      fitView
    >
      <Background />
      <Controls />
      <MiniMap nodeColor={(n) => statusColors[(n as TaskNode).data?.status ?? 'pending']} />
      <Panel position="top-right">
        <button onClick={onSave}>Save</button>
      </Panel>
    </ReactFlow>
  );
}

// ---- App Entry ----

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <FlowCanvas />
      </ReactFlowProvider>
    </div>
  );
}
```
