# React Flow v12 — API Reference

> TOC: [ReactFlow Props](#reactflow-props) | [Viewport Props](#viewport-props) | [Interaction Props](#interaction-props) | [Connection Props](#connection-props) | [Event Handlers](#event-handlers) | [Keyboard Props](#keyboard-props) | [ReactFlowInstance Methods](#reactflowinstance-methods) | [ReactFlowProvider](#reactflowprovider)

---

## ReactFlow Props

### Data Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `nodes` | `Node[]` | `[]` | Controlled nodes array |
| `edges` | `Edge[]` | `[]` | Controlled edges array |
| `defaultNodes` | `Node[]` | — | Uncontrolled initial nodes |
| `defaultEdges` | `Edge[]` | — | Uncontrolled initial edges |
| `nodeTypes` | `NodeTypes` | built-in | Map of type name → component. **Define outside component or useMemo!** |
| `edgeTypes` | `EdgeTypes` | built-in | Map of type name → component. Same warning. |
| `defaultEdgeOptions` | `DefaultEdgeOptions` | — | Defaults applied to all new edges (animated, type, style, etc.) |
| `width` | `number` | — | Fixed container width (used for SSR) |
| `height` | `number` | — | Fixed container height (used for SSR) |
| `nodeOrigin` | `NodeOrigin` | `[0, 0]` | Origin point for node positioning. `[0.5, 0.5]` = center |
| `colorMode` | `'light' \| 'dark' \| 'system'` | `'light'` | Built-in dark/light mode |
| `proOptions` | `ProOptions` | — | `{ hideAttribution: true }` (requires Pro license) |

### Viewport Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultViewport` | `Viewport` | `{x:0, y:0, zoom:1}` | Initial viewport |
| `viewport` | `Viewport` | — | Controlled viewport |
| `onViewportChange` | `(v: Viewport) => void` | — | Controlled viewport change handler |
| `fitView` | `boolean` | `false` | Auto-fit all nodes on init |
| `fitViewOptions` | `FitViewOptionsBase` | — | Options for fitView (`padding`, `duration`, `nodes`, etc.) |
| `minZoom` | `number` | `0.5` | Minimum zoom level |
| `maxZoom` | `number` | `2` | Maximum zoom level |
| `snapToGrid` | `boolean` | `false` | Snap nodes to grid while dragging |
| `snapGrid` | `[number, number]` | — | Grid cell size, e.g. `[15, 15]` |
| `onlyRenderVisibleElements` | `boolean` | `false` | Skip rendering off-screen elements |
| `translateExtent` | `CoordinateExtent` | infinite | `[[minX, minY], [maxX, maxY]]` — pan boundaries |
| `nodeExtent` | `CoordinateExtent` | — | Boundary for node placement |
| `preventScrolling` | `boolean` | `true` | Prevent page scroll over flow |
| `attributionPosition` | `PanelPosition` | `'bottom-right'` | Position of React Flow attribution link |

### Interaction Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `nodesDraggable` | `boolean` | `true` | All nodes draggable |
| `nodesConnectable` | `boolean` | `true` | All nodes connectable |
| `nodesFocusable` | `boolean` | `true` | Keyboard focus on nodes |
| `edgesFocusable` | `boolean` | `true` | Keyboard focus on edges |
| `elementsSelectable` | `boolean` | `true` | Click to select elements |
| `selectNodesOnDrag` | `boolean` | `true` | Select nodes on drag |
| `panOnDrag` | `boolean \| number[]` | `true` | Pan by drag. Array = mouse button IDs, e.g. `[1, 2]` for middle/right |
| `selectionOnDrag` | `boolean` | `false` | Enable drag-to-select without Shift |
| `selectionMode` | `'full' \| 'partial'` | `'full'` | `full` = node must be fully inside selection box |
| `panOnScroll` | `boolean` | `false` | Pan with scroll wheel |
| `panOnScrollSpeed` | `number` | `0.5` | Scroll pan speed |
| `panOnScrollMode` | `'free' \| 'horizontal' \| 'vertical'` | `'free'` | Scroll pan direction |
| `zoomOnScroll` | `boolean` | `true` | Zoom with scroll wheel |
| `zoomOnPinch` | `boolean` | `true` | Zoom with pinch gesture |
| `zoomOnDoubleClick` | `boolean` | `true` | Zoom with double-click |
| `connectOnClick` | `boolean` | `true` | Allow click-to-connect mode |
| `connectionMode` | `'strict' \| 'loose'` | `'strict'` | `loose` allows source→source connections |
| `autoPanOnConnect` | `boolean` | `true` | Auto-pan when dragging connection near edge |
| `autoPanOnNodeDrag` | `boolean` | `true` | Auto-pan when dragging node near edge |
| `autoPanSpeed` | `number` | `15` | Auto-pan speed in px/frame |
| `elevateNodesOnSelect` | `boolean` | `true` | Raise z-index of selected nodes |
| `elevateEdgesOnSelect` | `boolean` | `false` | Raise z-index of selected edges |
| `nodeDragThreshold` | `number` | `1` | Pixels before drag starts |
| `zIndexMode` | `'basic' \| 'elevated'` | `'basic'` | Z-index calculation strategy |

### Connection Line Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `connectionLineType` | `ConnectionLineType` | `'default'` | Path shape during drag: `'default'`, `'straight'`, `'step'`, `'smoothstep'`, `'simplebezier'` |
| `connectionLineStyle` | `CSSProperties` | — | Style for the in-progress connection line |
| `connectionLineComponent` | `ConnectionLineComponent` | — | Custom component for connection line |
| `connectionRadius` | `number` | `20` | Snap-to-handle radius in pixels |
| `reconnectRadius` | `number` | `10` | Radius for edge reconnect handles |
| `edgesReconnectable` | `boolean` | `true` | Allow dragging edge endpoints to reconnect |
| `isValidConnection` | `IsValidConnection` | — | `(connection: Connection) => boolean` — validate new connections |

### Keyboard Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `deleteKeyCode` | `KeyCode \| null` | `'Backspace'` | Key to delete selected elements. `null` to disable |
| `selectionKeyCode` | `KeyCode \| null` | `'Shift'` | Key to activate drag-selection box |
| `multiSelectionKeyCode` | `KeyCode \| null` | platform | Cmd/Ctrl for multi-select |
| `zoomActivationKeyCode` | `KeyCode \| null` | platform | Key to activate zoom mode |
| `panActivationKeyCode` | `KeyCode \| null` | `'Space'` | Key to activate pan mode |
| `disableKeyboardA11y` | `boolean` | `false` | Disable keyboard accessibility features |

### Style Helper Props

| Prop | Type | Default |
|------|------|---------|
| `noPanClassName` | `string` | `'nopan'` |
| `noDragClassName` | `string` | `'nodrag'` |
| `noWheelClassName` | `string` | `'nowheel'` |

---

## Event Handlers

All handlers should be `useCallback`-memoized to avoid re-render loops.

### General

| Handler | Signature | Description |
|---------|-----------|-------------|
| `onInit` | `(instance: ReactFlowInstance) => void` | Called once after viewport mounts |
| `onError` | `(id: string, message: string) => void` | React Flow internal error |
| `onDelete` | `(params: {nodes: Node[], edges: Edge[]}) => void` | After deletion |
| `onBeforeDelete` | `(params) => Promise<boolean \| {nodes, edges}>` | Before deletion — return `false` to cancel |

### Node Events

| Handler | Signature |
|---------|-----------|
| `onNodesChange` | `(changes: NodeChange[]) => void` |
| `onNodesDelete` | `(nodes: Node[]) => void` |
| `onNodeClick` | `(event: MouseEvent, node: Node) => void` |
| `onNodeDoubleClick` | `(event: MouseEvent, node: Node) => void` |
| `onNodeDragStart` | `(event: MouseEvent, node: Node, nodes: Node[]) => void` |
| `onNodeDrag` | `(event: MouseEvent, node: Node, nodes: Node[]) => void` |
| `onNodeDragStop` | `(event: MouseEvent, node: Node, nodes: Node[]) => void` |
| `onNodeMouseEnter` | `(event: MouseEvent, node: Node) => void` |
| `onNodeMouseMove` | `(event: MouseEvent, node: Node) => void` |
| `onNodeMouseLeave` | `(event: MouseEvent, node: Node) => void` |
| `onNodeContextMenu` | `(event: MouseEvent, node: Node) => void` |

### Edge Events

| Handler | Signature |
|---------|-----------|
| `onEdgesChange` | `(changes: EdgeChange[]) => void` |
| `onEdgesDelete` | `(edges: Edge[]) => void` |
| `onEdgeClick` | `(event: MouseEvent, edge: Edge) => void` |
| `onEdgeDoubleClick` | `(event: MouseEvent, edge: Edge) => void` |
| `onEdgeMouseEnter` | `(event: MouseEvent, edge: Edge) => void` |
| `onEdgeMouseMove` | `(event: MouseEvent, edge: Edge) => void` |
| `onEdgeMouseLeave` | `(event: MouseEvent, edge: Edge) => void` |
| `onEdgeContextMenu` | `(event: MouseEvent, edge: Edge) => void` |
| `onReconnect` | `(oldEdge: Edge, newConnection: Connection) => void` |
| `onReconnectStart` | `(event, edge, handleType) => void` |
| `onReconnectEnd` | `(event, edge, handleType, connectionState) => void` |

### Connection Events

| Handler | Signature |
|---------|-----------|
| `onConnect` | `(connection: Connection) => void` |
| `onConnectStart` | `(event: MouseEvent \| TouchEvent, params: {nodeId, handleId, handleType}) => void` |
| `onConnectEnd` | `(event: MouseEvent \| TouchEvent, connectionState) => void` |
| `onClickConnectStart` | Same as `onConnectStart` for click-connect |
| `onClickConnectEnd` | Same as `onConnectEnd` for click-connect |

### Pane Events

| Handler | Signature |
|---------|-----------|
| `onPaneClick` | `(event: MouseEvent) => void` |
| `onPaneContextMenu` | `(event: MouseEvent) => void` |
| `onPaneScroll` | `(event?: WheelEvent) => void` |
| `onPaneMouseMove` | `(event: MouseEvent) => void` |
| `onPaneMouseEnter` | `(event: MouseEvent) => void` |
| `onPaneMouseLeave` | `(event: MouseEvent) => void` |
| `onMove` | `(event: MouseEvent \| TouchEvent, viewport: Viewport) => void` |
| `onMoveStart` | Same signature as `onMove` |
| `onMoveEnd` | Same signature as `onMove` |

### Selection Events

| Handler | Signature |
|---------|-----------|
| `onSelectionChange` | `({nodes: Node[], edges: Edge[]}) => void` |
| `onSelectionDragStart` | `(event: MouseEvent, nodes: Node[]) => void` |
| `onSelectionDrag` | `(event: MouseEvent, nodes: Node[]) => void` |
| `onSelectionDragStop` | `(event: MouseEvent, nodes: Node[]) => void` |
| `onSelectionStart` | `(event: MouseEvent) => void` |
| `onSelectionEnd` | `(event: MouseEvent) => void` |
| `onSelectionContextMenu` | `(event: MouseEvent, nodes: Node[]) => void` |

---

## ReactFlowInstance Methods

Returned by `useReactFlow()`. Also passed to `onInit`.

### Node Methods

```typescript
getNodes(): Node[]
setNodes(payload: Node[] | ((nodes: Node[]) => Node[])): void
addNodes(payload: Node | Node[]): void
getNode(id: string): Node | undefined
getInternalNode(id: string): InternalNode | undefined
updateNode(
  id: string,
  nodeUpdate: Partial<Node> | ((node: Node) => Partial<Node>),
  options?: { replace?: boolean }
): void
updateNodeData(
  id: string,
  dataUpdate: Partial<NodeData> | ((node: Node) => Partial<NodeData>),
  options?: { replace?: boolean }
): void
getNodesBounds(nodes: (string | Node | InternalNode)[]): Rect
getNodeConnections(params: { nodeId: string; type?: 'source' | 'target'; handleId?: string }): NodeConnection[]
getHandleConnections(params: { nodeId: string; type: 'source' | 'target'; id?: string }): HandleConnection[]
getIntersectingNodes(
  node: Node | Rect | { id: string },
  partially?: boolean,
  nodes?: Node[]
): Node[]
isNodeIntersecting(
  node: Node | Rect | { id: string },
  area: Rect,
  partially?: boolean
): boolean
```

### Edge Methods

```typescript
getEdges(): Edge[]
setEdges(payload: Edge[] | ((edges: Edge[]) => Edge[])): void
addEdges(payload: Edge | Edge[]): void
getEdge(id: string): Edge | undefined
updateEdge(
  id: string,
  edgeUpdate: Partial<Edge> | ((edge: Edge) => Partial<Edge>),
  options?: { replace?: boolean }
): void
updateEdgeData(
  id: string,
  dataUpdate: Partial<EdgeData> | ((edge: Edge) => Partial<EdgeData>),
  options?: { replace?: boolean }
): void
deleteElements(params: {
  nodes?: (Node | { id: string })[],
  edges?: (Edge | { id: string })[]
}): Promise<{ deletedNodes: Node[], deletedEdges: Edge[] }>
```

### Viewport Methods

```typescript
getViewport(): Viewport               // { x, y, zoom }
setViewport(viewport: Viewport, options?: { duration?: number }): Promise<boolean>
getZoom(): number
zoomIn(options?: { duration?: number }): Promise<boolean>
zoomOut(options?: { duration?: number }): Promise<boolean>
zoomTo(zoomLevel: number, options?: { duration?: number }): Promise<boolean>
fitView(options?: FitViewOptions): Promise<boolean>
fitBounds(bounds: Rect, options?: { padding?: number; duration?: number }): Promise<boolean>
setCenter(x: number, y: number, options?: { zoom?: number; duration?: number }): Promise<boolean>
screenToFlowPosition(
  clientPosition: { x: number; y: number },
  options?: { snapToGrid?: boolean }
): { x: number; y: number }
flowToScreenPosition(flowPosition: { x: number; y: number }): { x: number; y: number }
```

### Other

```typescript
toObject(): ReactFlowJsonObject   // { nodes, edges, viewport }
viewportInitialized: boolean      // true after DOM init complete
```

---

## ReactFlowProvider

Provides React Flow context to components outside `<ReactFlow />`.

```tsx
import { ReactFlowProvider, ReactFlow } from '@xyflow/react';

// Wrap when you need hooks outside ReactFlow's children
export default function App() {
  return (
    <ReactFlowProvider>
      <div style={{ width: '100vw', height: '100vh' }}>
        <ReactFlow nodes={nodes} edges={edges} ... />
      </div>
      <Sidebar /> {/* can use useNodes(), useEdges(), etc. here */}
    </ReactFlowProvider>
  );
}
```

**When you need it:**
- Using hooks (`useNodes`, `useEdges`, `useReactFlow`, etc.) outside `<ReactFlow />`'s children
- Multiple flows on one page (each needs its own `<ReactFlowProvider>`)
- SSR: `<ReactFlowProvider initialNodes={nodes} initialEdges={edges} initialWidth={w} initialHeight={h} fitView>`
- Client-side routing (React Router, Next.js)

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `initialNodes` | `Node[]` | For SSR initialization (not reactive) |
| `initialEdges` | `Edge[]` | For SSR initialization (not reactive) |
| `initialWidth` | `number` | For SSR fitView calculation |
| `initialHeight` | `number` | For SSR fitView calculation |
| `fitView` | `boolean` | Auto-fit on SSR |
| `nodeOrigin` | `NodeOrigin` | Default `[0, 0]` |
