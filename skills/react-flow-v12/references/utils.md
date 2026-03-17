# React Flow v12 — Utility Functions Reference

All utilities imported from `@xyflow/react`.

> TOC: [addEdge](#addedge) | [applyNodeChanges](#applynodechanges) | [applyEdgeChanges](#applyedgechanges) | [getBezierPath](#getbezierpath) | [getSmoothStepPath](#getsmoothsteppath) | [getStraightPath](#getstraightpath) | [getSimpleBezierPath](#getsimplebezierpath) | [getConnectedEdges](#getconnectededges) | [getIncomers](#getincomers) | [getOutgoers](#getoutgoers) | [getNodesBounds](#getnodesbounds) | [getViewportForBounds](#getviewportforbounds) | [reconnectEdge](#reconnectedge) | [isNode](#isnode) | [isEdge](#isedge)

---

## addEdge

Adds a new edge or connection to an edges array. Prevents duplicate edges.

```typescript
function addEdge(
  edgeParams: Edge | Connection,
  edges: Edge[],
  options?: { getEdgeId?: (edge: Edge | Connection) => string }
): Edge[]
```

If an edge already exists with the same `source`, `target`, `sourceHandle`, and `targetHandle`, the new edge is NOT added.

```tsx
import { addEdge, useEdgesState } from '@xyflow/react';
import { useCallback } from 'react';

const [edges, setEdges, onEdgesChange] = useEdgesState([]);

const onConnect = useCallback(
  (connection) => setEdges((eds) => addEdge(connection, eds)),
  [setEdges]
);

// With custom options
const onConnect = useCallback(
  (connection) => setEdges((eds) => addEdge(
    { ...connection, animated: true, type: 'smoothstep' },
    eds
  )),
  [setEdges]
);
```

---

## applyNodeChanges

Applies an array of `NodeChange` events to a nodes array. Used inside `onNodesChange`.

```typescript
function applyNodeChanges<NodeType>(
  changes: NodeChange<NodeType>[],
  nodes: NodeType[]
): NodeType[]
```

```tsx
import { useState, useCallback } from 'react';
import { ReactFlow, applyNodeChanges } from '@xyflow/react';

export default function App() {
  const [nodes, setNodes] = useState(initialNodes);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  return <ReactFlow nodes={nodes} onNodesChange={onNodesChange} ... />;
}
```

Note: `useNodesState` wraps this for you.

---

## applyEdgeChanges

Applies an array of `EdgeChange` events to an edges array. Used inside `onEdgesChange`.

```typescript
function applyEdgeChanges<EdgeType>(
  changes: EdgeChange<EdgeType>[],
  edges: EdgeType[]
): EdgeType[]
```

```tsx
const onEdgesChange = useCallback(
  (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
  []
);
```

Note: `useEdgesState` wraps this for you.

---

## getBezierPath

Computes SVG path for a bezier curve edge. Returns path string + label center coordinates.

```typescript
function getBezierPath(params: {
  sourceX: number;
  sourceY: number;
  sourcePosition?: Position;  // default: Position.Bottom
  targetX: number;
  targetY: number;
  targetPosition?: Position;  // default: Position.Top
  curvature?: number;          // default: 0.25
}): [
  path: string,
  labelX: number,
  labelY: number,
  offsetX: number,
  offsetY: number
]
```

```tsx
import { Position, getBezierPath } from '@xyflow/react';

const [path, labelX, labelY] = getBezierPath({
  sourceX: 0,
  sourceY: 20,
  sourcePosition: Position.Right,
  targetX: 150,
  targetY: 100,
  targetPosition: Position.Left,
});
// path: "M0,20 C75,20 75,100 150,100"
// labelX: 75, labelY: 60

// Inside a custom edge component (EdgeProps contains all needed values):
function MyEdge({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, ...props }: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });
  return <BaseEdge id={props.id} path={edgePath} />;
}
```

---

## getSmoothStepPath

Computes SVG path for a smooth step edge (right-angle turns with optional rounded corners).

```typescript
function getSmoothStepPath(params: {
  sourceX: number;
  sourceY: number;
  sourcePosition?: Position;  // default: Position.Bottom
  targetX: number;
  targetY: number;
  targetPosition?: Position;  // default: Position.Top
  borderRadius?: number;       // default: 5. Use 0 for sharp corners.
  centerX?: number;            // optional midpoint x override
  centerY?: number;            // optional midpoint y override
  offset?: number;             // default: 20
  stepPosition?: number;       // 0-1, default: 0.5 (where the step bend occurs)
}): [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number]
```

```tsx
const [path, labelX, labelY] = getSmoothStepPath({
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  borderRadius: 10,  // rounded corners
});

// Sharp corners:
const [path] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, borderRadius: 0 });
```

---

## getStraightPath

Computes a straight line SVG path between two points.

```typescript
function getStraightPath(params: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}): [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number]
```

```tsx
const [path, labelX, labelY] = getStraightPath({
  sourceX: 0, sourceY: 20,
  targetX: 150, targetY: 100,
});
// path: "M 0,20L 150,100"
// labelX: 75, labelY: 60
```

---

## getSimpleBezierPath

Computes a simplified bezier curve with less curvature than `getBezierPath`.

```typescript
function getSimpleBezierPath(params: {
  sourceX: number;
  sourceY: number;
  sourcePosition?: Position;
  targetX: number;
  targetY: number;
  targetPosition?: Position;
}): [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number]
```

---

## getConnectedEdges

Returns edges connected to at least one of the given nodes.

```typescript
function getConnectedEdges<NodeType, EdgeType>(
  nodes: NodeType[],
  edges: EdgeType[]
): EdgeType[]
```

```tsx
import { getConnectedEdges } from '@xyflow/react';

// Find all edges connected to selected nodes
const { getNodes, getEdges } = useReactFlow();
const selectedNodes = getNodes().filter((n) => n.selected);
const connectedEdges = getConnectedEdges(selectedNodes, getEdges());
```

---

## getIncomers

Returns nodes that have outgoing edges pointing TO the given node (i.e., upstream nodes).

```typescript
function getIncomers<NodeType, EdgeType>(
  node: NodeType | { id: string },
  nodes: NodeType[],
  edges: EdgeType[]
): NodeType[]
```

```tsx
import { getIncomers } from '@xyflow/react';

const { getNodes, getEdges } = useReactFlow();
const myNode = getNodes().find((n) => n.id === 'target-node');
const parents = getIncomers(myNode, getNodes(), getEdges());
// parents = nodes with edges going INTO myNode
```

---

## getOutgoers

Returns nodes that the given node has edges pointing TO (i.e., downstream nodes).

```typescript
function getOutgoers<NodeType, EdgeType>(
  node: NodeType | { id: string },
  nodes: NodeType[],
  edges: EdgeType[]
): NodeType[]
```

```tsx
const children = getOutgoers(sourceNode, getNodes(), getEdges());
// children = nodes that sourceNode connects to
```

---

## getNodesBounds

Returns the bounding box enclosing all given nodes.

```typescript
function getNodesBounds<NodeType>(
  nodes: (string | NodeType | InternalNode)[],
  params?: {
    nodeOrigin?: NodeOrigin;   // default: [0, 0]
    nodeLookup?: NodeLookup;
  }
): Rect  // { x, y, width, height }
```

```tsx
import { getNodesBounds, getViewportForBounds } from '@xyflow/react';

// Get bounds and compute viewport to fit them
const bounds = getNodesBounds(nodes);
const viewport = getViewportForBounds(bounds, containerWidth, containerHeight, 0.5, 2);
```

---

## getViewportForBounds

Computes the viewport needed to fit a given rectangle. Useful for SSR and pre-calculating viewports without changing the actual viewport.

```typescript
function getViewportForBounds(
  bounds: Rect,
  width: number,
  height: number,
  minZoom: number,
  maxZoom: number,
  padding?: number
): Viewport  // { x, y, zoom }
```

```tsx
import { getNodesBounds, getViewportForBounds } from '@xyflow/react';

function generateOgImage(nodes: Node[], edges: Edge[]) {
  const bounds = getNodesBounds(nodes);
  const { x, y, zoom } = getViewportForBounds(bounds, 1200, 630, 0.5, 2, 0.1);
  // Use x, y, zoom to position a static rendering
}
```

---

## reconnectEdge

Updates an edge's source/target connection. Used with `onReconnect`.

```typescript
function reconnectEdge<EdgeType>(
  oldEdge: EdgeType,
  newConnection: Connection,
  edges: EdgeType[],
  options?: {
    shouldReplaceId?: boolean;   // default: true — replace edge id with new connection id
    getEdgeId?: (edge: Connection) => string;
  }
): EdgeType[]
```

```tsx
import { reconnectEdge } from '@xyflow/react';
import { useCallback } from 'react';

const [edges, setEdges] = useEdgesState(initialEdges);

const onReconnect = useCallback(
  (oldEdge, newConnection) =>
    setEdges((els) => reconnectEdge(oldEdge, newConnection, els)),
  []
);

<ReactFlow onReconnect={onReconnect} ... />
```

---

## isNode

Type guard to check if a value is a React Flow Node.

```typescript
function isNode(element: Node | Edge | unknown): element is Node
```

```tsx
import { isNode } from '@xyflow/react';

const elements = [...nodes, ...edges];
const onlyNodes = elements.filter(isNode);
```

---

## isEdge

Type guard to check if a value is a React Flow Edge.

```typescript
function isEdge(element: Node | Edge | unknown): element is Edge
```

```tsx
const onlyEdges = elements.filter(isEdge);
```
