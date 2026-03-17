# React Flow v12 — Types Reference

> TOC: [Node](#node) | [Edge](#edge) | [NodeProps](#nodeprops) | [EdgeProps](#edgeprops) | [Connection](#connection) | [ConnectionState](#connectionstate) | [Viewport](#viewport) | [NodeChange](#nodechange) | [EdgeChange](#edgechange) | [Handle](#handle-type) | [ReactFlowInstance](#reactflowinstance-type) | [FitViewOptions](#fitviewoptions) | [OnBeforeDelete](#onbeforedelete) | [Position](#position) | [MarkerType](#markertype) | [Other Types](#other-types)

All types imported from `@xyflow/react`.

---

## Node

```typescript
type Node<NodeData = Record<string, unknown>, NodeType extends string = string> = {
  // Required
  id: string;
  position: XYPosition;       // { x: number; y: number }
  data: NodeData;

  // Type & appearance
  type?: NodeType;            // matches key in nodeTypes map; built-ins: 'default' | 'input' | 'output' | 'group'
  style?: CSSProperties;
  className?: string;
  hidden?: boolean;

  // Dimensions (read-only from React Flow's perspective)
  width?: number;             // set via style/className; do NOT set directly for resizing
  height?: number;            // same — use for SSR or static sizing
  initialWidth?: number;      // hint for first render (then measured)
  initialHeight?: number;     // hint for first render (then measured)
  measured?: {                // populated by React Flow after measurement
    width?: number;
    height?: number;
  };

  // Behavior
  draggable?: boolean;        // overrides ReactFlow.nodesDraggable
  selectable?: boolean;       // overrides ReactFlow.elementsSelectable
  connectable?: boolean;      // overrides ReactFlow.nodesConnectable
  deletable?: boolean;
  focusable?: boolean;
  resizing?: boolean;         // set internally when NodeResizer active

  // Handles
  sourcePosition?: Position;  // for default/input/output nodes
  targetPosition?: Position;  // for default/input/output nodes
  handles?: NodeHandle[];     // for SSR: pre-define handle positions

  // State (managed by React Flow)
  selected?: boolean;
  dragging?: boolean;

  // Layout
  zIndex?: number;
  origin?: NodeOrigin;        // [0,0]=top-left, [0.5,0.5]=center
  parentId?: string;          // for sub-flows (renamed from parentNode in v12)
  extent?: CoordinateExtent | 'parent' | null;
  expandParent?: boolean;     // expand parent when dragged to edge

  // Advanced
  dragHandle?: string;        // CSS selector for drag handle (e.g., '.drag-handle')
  ariaLabel?: string;
  ariaRole?: AriaRole;
  domAttributes?: HTMLAttributes<HTMLDivElement>;
};
```

**Built-in node types**: `'default'` (handles on top/bottom), `'input'` (source handle only), `'output'` (target handle only), `'group'` (no handles, used as parent).

---

## Edge

```typescript
type Edge<EdgeData = Record<string, unknown>, EdgeType extends string = string> = {
  // Required
  id: string;
  source: string;             // source node id
  target: string;             // target node id

  // Handle targeting
  sourceHandle?: string | null;   // id of source handle (when node has multiple)
  targetHandle?: string | null;   // id of target handle

  // Type
  type?: EdgeType;            // matches key in edgeTypes; built-ins: 'default' | 'straight' | 'step' | 'smoothstep' | 'simplebezier'

  // Appearance
  style?: CSSProperties;
  className?: string;
  animated?: boolean;
  hidden?: boolean;
  markerStart?: EdgeMarkerType;   // { type: MarkerType, color?, ... } or string id
  markerEnd?: EdgeMarkerType;

  // Label (for built-in label rendering in SVG)
  label?: ReactNode;
  labelStyle?: CSSProperties;
  labelShowBg?: boolean;
  labelBgStyle?: CSSProperties;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;

  // Behavior
  selectable?: boolean;
  deletable?: boolean;
  focusable?: boolean;
  reconnectable?: boolean | HandleType;
  interactionWidth?: number;  // invisible hit area, default: 20

  // State
  selected?: boolean;
  zIndex?: number;

  // Custom data
  data?: EdgeData;

  // Type-specific path options
  pathOptions?: {
    // For 'default' (bezier): curvature?: number
    // For 'smoothstep': offset?: number; borderRadius?: number
    offset?: number;
    borderRadius?: number;
    curvature?: number;
  };

  // Advanced
  ariaLabel?: string;
  ariaRole?: AriaRole;
  domAttributes?: SVGAttributes<SVGPathElement>;
};
```

**Built-in edge types**: `'default'` (bezier), `'straight'`, `'step'` (sharp corners), `'smoothstep'` (rounded corners), `'simplebezier'`

---

## NodeProps

Received by custom node components. All fields are from the `Node` type.

```typescript
type NodeProps<NodeType extends Node = Node> = {
  id: NodeType['id'];
  data: NodeType['data'];
  type: NodeType['type'];
  width: NodeType['width'];
  height: NodeType['height'];
  sourcePosition: NodeType['sourcePosition'];
  targetPosition: NodeType['targetPosition'];
  dragHandle: NodeType['dragHandle'];
  parentId: NodeType['parentId'];
  selected: NodeType['selected'];
  draggable: NodeType['draggable'];
  selectable: NodeType['selectable'];
  deletable: NodeType['deletable'];
  dragging: NodeType['dragging'];
  zIndex: NodeType['zIndex'];
  isConnectable: boolean;         // overall connectability
  positionAbsoluteX: number;      // absolute x (for sub-flow children)
  positionAbsoluteY: number;      // absolute y
};
```

**TypeScript pattern**:

```typescript
type MyNodeData = { label: string; value: number };
type MyNode = Node<MyNodeData, 'myNode'>;

function MyNodeComponent({ id, data, selected }: NodeProps<MyNode>) {
  // data is typed as MyNodeData
  return <div>{data.label}: {data.value}</div>;
}
```

---

## EdgeProps

Received by custom edge components.

```typescript
type EdgeProps<EdgeType extends Edge = Edge> = {
  id: EdgeType['id'];
  source: EdgeType['source'];
  target: EdgeType['target'];
  sourceHandle: EdgeType['sourceHandle'];
  targetHandle: EdgeType['targetHandle'];
  type: EdgeType['type'];
  animated: EdgeType['animated'];
  data: EdgeType['data'];
  style: EdgeType['style'];
  selected: EdgeType['selected'];
  selectable: EdgeType['selectable'];
  deletable: EdgeType['deletable'];
  label: EdgeType['label'];
  labelStyle: EdgeType['labelStyle'];
  labelShowBg: EdgeType['labelShowBg'];
  labelBgStyle: EdgeType['labelBgStyle'];
  labelBgPadding: EdgeType['labelBgPadding'];
  labelBgBorderRadius: EdgeType['labelBgBorderRadius'];
  markerStart: string;              // resolved to "url(#markerId)"
  markerEnd: string;                // resolved to "url(#markerId)"
  pathOptions: EdgeType['pathOptions'];
  interactionWidth: EdgeType['interactionWidth'];

  // Computed positions (from node handles)
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  sourceHandleId: string | null;
  targetHandleId: string | null;
};
```

**TypeScript pattern**:

```typescript
type MyEdge = Edge<{ weight: number }, 'myEdge'>;

function MyEdgeComponent({ id, data, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }: EdgeProps<MyEdge>) {
  const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  return <BaseEdge id={id} path={path} label={`Weight: ${data?.weight}`} />;
}
```

---

## Connection

Minimal connection description. Returned by `onConnect`.

```typescript
type Connection = {
  source: string;           // source node id
  target: string;           // target node id
  sourceHandle: string | null;  // source handle id (null if no id)
  targetHandle: string | null;  // target handle id (null if no id)
};
```

---

## ConnectionState

Current state during a connection drag. Returned by `useConnection()`.

```typescript
type ConnectionState<NodeType> = {
  inProgress: boolean;
  isValid: boolean | null;
  from: XYPosition | null;
  fromHandle: Handle | null;
  fromPosition: Position | null;
  fromNode: InternalNode<NodeType> | null;
  to: XYPosition | null;
  toHandle: Handle | null;
  toPosition: Position | null;
  toNode: InternalNode<NodeType> | null;
};
```

---

## Viewport

```typescript
type Viewport = {
  x: number;    // pan x offset in pixels
  y: number;    // pan y offset in pixels
  zoom: number; // zoom level (1 = 100%)
};
```

---

## NodeChange

Union of all possible node change events. Passed to `onNodesChange`.

```typescript
type NodeChange<NodeType> =
  | NodePositionChange      // node moved/dragging
  | NodeDimensionChange     // node resized
  | NodeSelectionChange     // node selected/deselected
  | NodeRemoveChange        // node deleted
  | NodeAddChange<NodeType> // node added
  | NodeReplaceChange<NodeType>; // node replaced

type NodePositionChange = {
  type: 'position';
  id: string;
  position?: XYPosition;
  positionAbsolute?: XYPosition;
  dragging?: boolean;
};

type NodeDimensionChange = {
  type: 'dimensions';
  id: string;
  dimensions?: Dimensions;    // { width, height }
  resizing?: boolean;
  setAttributes?: boolean | 'width' | 'height';
};

type NodeSelectionChange = {
  type: 'select';
  id: string;
  selected: boolean;
};

type NodeRemoveChange = {
  type: 'remove';
  id: string;
};

type NodeAddChange<T> = {
  type: 'add';
  item: T;
  index?: number;
};

type NodeReplaceChange<T> = {
  type: 'replace';
  id: string;
  item: T;
};
```

---

## EdgeChange

Union of all possible edge change events. Passed to `onEdgesChange`.

```typescript
type EdgeChange<EdgeType> =
  | EdgeAddChange<EdgeType>
  | EdgeRemoveChange
  | EdgeReplaceChange<EdgeType>
  | EdgeSelectionChange;

type EdgeAddChange<T> = { type: 'add'; item: T; index?: number };
type EdgeRemoveChange = { type: 'remove'; id: string };
type EdgeReplaceChange<T> = { type: 'replace'; id: string; item: T };
type EdgeSelectionChange = { type: 'select'; id: string; selected: boolean };
```

---

## Handle (type)

Handle descriptor attached to a node.

```typescript
type NodeHandle = {
  id?: string | null;
  type?: HandleType;        // 'source' | 'target'
  position?: Position;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};
```

---

## ReactFlowInstance (type)

See `references/api-reference.md` for all method signatures. TypeScript usage:

```typescript
import type { ReactFlowInstance, Node, Edge } from '@xyflow/react';

type MyNodeType = Node<{ label: string }, 'myNode'>;
type MyEdgeType = Edge<{ weight: number }, 'myEdge'>;

// With generic types
const instance = useReactFlow<MyNodeType, MyEdgeType>();
// instance.getNodes() returns MyNodeType[]
```

---

## FitViewOptions

```typescript
type FitViewOptions<NodeType> = {
  padding?: number;               // space around fitted content (0.1 = 10%)
  includeHiddenNodes?: boolean;
  minZoom?: number;
  maxZoom?: number;
  duration?: number;              // animation duration in ms
  ease?: (t: number) => number;   // easing function
  interpolate?: 'smooth' | 'linear';
  nodes?: (NodeType | { id: string })[];  // fit to specific nodes only
};
```

---

## OnBeforeDelete

Callback to intercept and optionally prevent deletion. Must be `async`.

```typescript
type OnBeforeDelete<NodeType, EdgeType> = (params: {
  nodes: NodeType[];
  edges: EdgeType[];
}) => Promise<
  boolean |                          // true = allow, false = prevent all
  { nodes: NodeType[]; edges: EdgeType[] }  // return subset to delete
>;
```

```tsx
const onBeforeDelete = useCallback(async ({ nodes, edges }) => {
  // Prevent deleting nodes with isProtected
  const deletableNodes = nodes.filter((n) => !n.data.isProtected);
  return { nodes: deletableNodes, edges };
}, []);

<ReactFlow onBeforeDelete={onBeforeDelete} ... />
```

---

## Position

```typescript
enum Position {
  Left = 'left',
  Top = 'top',
  Right = 'right',
  Bottom = 'bottom',
}
```

---

## MarkerType

```typescript
enum MarkerType {
  Arrow = 'arrow',
  ArrowClosed = 'arrowclosed',
}
```

Usage:

```tsx
const edges = [{
  id: 'e1',
  source: 'n1',
  target: 'n2',
  markerEnd: { type: MarkerType.ArrowClosed, color: '#ff0072', width: 20, height: 20 },
  markerStart: { type: MarkerType.Arrow },
}];
```

---

## Other Types

```typescript
type XYPosition = { x: number; y: number };
type Rect = { x: number; y: number; width: number; height: number };
type Dimensions = { width: number; height: number };
type NodeOrigin = [number, number];  // [0,0]=top-left, [0.5,0.5]=center
type CoordinateExtent = [[number, number], [number, number]];  // [[minX,minY],[maxX,maxY]]
type HandleType = 'source' | 'target';
type PanelPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center-left' | 'center-right';
type ConnectionLineType = 'default' | 'straight' | 'step' | 'smoothstep' | 'simplebezier';
type SelectionMode = 'full' | 'partial';
type ConnectionMode = 'strict' | 'loose';
type ColorMode = 'light' | 'dark' | 'system';
type KeyCode = string | string[];  // e.g., 'Backspace', 'Meta+s', ['Delete','Backspace']

// BuiltInNode / BuiltInEdge — for TypeScript union with custom types
import type { BuiltInNode, BuiltInEdge } from '@xyflow/react';
type AppNode = BuiltInNode | MyCustomNode;
type AppEdge = BuiltInEdge | MyCustomEdge;

// IsValidConnection
type IsValidConnection<EdgeType> = (connection: EdgeType | Connection) => boolean;

// ReactFlowJsonObject — from toObject()
type ReactFlowJsonObject<NodeType, EdgeType> = {
  nodes: NodeType[];
  edges: EdgeType[];
  viewport: Viewport;
};
```

### TypeScript — Full App Example with Custom Types

```typescript
import {
  type Node, type Edge, type NodeTypes, type EdgeTypes,
  type BuiltInNode, type BuiltInEdge,
} from '@xyflow/react';

// Define custom nodes
type TextNode = Node<{ text: string }, 'text'>;
type NumberNode = Node<{ value: number }, 'number'>;
type AppNode = BuiltInNode | TextNode | NumberNode;

// Define custom edges
type WeightedEdge = Edge<{ weight: number }, 'weighted'>;
type AppEdge = BuiltInEdge | WeightedEdge;

// Type-safe hooks
const { getNodes } = useReactFlow<AppNode, AppEdge>();
const nodes = useNodes<AppNode>();

// Type guard
function isTextNode(node: AppNode): node is TextNode {
  return node.type === 'text';
}

// nodeTypes/edgeTypes with typed components
const nodeTypes: NodeTypes = {
  text: TextNodeComponent,
  number: NumberNodeComponent,
};
const edgeTypes: EdgeTypes = {
  weighted: WeightedEdgeComponent,
};
```
