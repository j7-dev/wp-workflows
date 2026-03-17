# React Flow v12 — Components Reference

> TOC: [Background](#background) | [Controls](#controls) | [ControlButton](#controlbutton) | [MiniMap](#minimap) | [Panel](#panel) | [Handle](#handle) | [NodeToolbar](#nodetoolbar) | [NodeResizer](#noderesizer) | [NodeResizeControl](#noderesizecontrol) | [BaseEdge](#baseedge) | [EdgeLabelRenderer](#edgelabelrenderer) | [EdgeText](#edgetext) | [EdgeToolbar](#edgetoolbar) | [ViewportPortal](#viewportportal) | [ReactFlowProvider](#reactflowprovider-1)

All UI components are children of `<ReactFlow />` except where noted.

---

## Background

Adds a visual grid pattern to the canvas.

```tsx
import { Background, BackgroundVariant } from '@xyflow/react';

<Background
  variant={BackgroundVariant.Dots}  // 'dots' | 'lines' | 'cross'
  gap={20}                          // grid spacing (number or [x, y])
  color="#e2e2e2"                    // pattern color
  bgColor="#ffffff"                  // background color
  size={1}                           // dot radius or cross size
  lineWidth={1}                      // stroke width
  offset={0}                         // pattern offset
  id="bg-1"                          // unique ID (required for multiple Backgrounds)
  className=""
  patternClassName=""
  style={{}}
/>
```

**Multiple layered backgrounds** (each needs unique `id`):

```tsx
<ReactFlow ...>
  <Background id="1" gap={10} color="#f1f1f1" variant={BackgroundVariant.Lines} />
  <Background id="2" gap={100} color="#ccc" variant={BackgroundVariant.Lines} />
</ReactFlow>
```

`BackgroundVariant` enum: `Dots`, `Lines`, `Cross`

---

## Controls

Floating control panel with zoom in/out, fit view, and lock buttons.

```tsx
import { Controls } from '@xyflow/react';

<Controls
  position="bottom-left"           // PanelPosition, default: 'bottom-left'
  showZoom={true}                  // show zoom in/out buttons
  showFitView={true}               // show fit view button
  showInteractive={true}           // show lock/unlock button
  fitViewOptions={{ padding: 0.1 }}
  onZoomIn={() => {}}              // additional callback on zoom in
  onZoomOut={() => {}}             // additional callback on zoom out
  onFitView={() => {}}             // override fit view behavior
  onInteractiveChange={(isInteractive) => {}}
  orientation="vertical"           // 'vertical' | 'horizontal'
  aria-label="React Flow controls"
  className=""
  style={{}}
/>
```

**Add custom buttons**:

```tsx
import { Controls, ControlButton } from '@xyflow/react';

<Controls>
  <ControlButton onClick={() => alert('Custom!')} title="Custom action">
    <MyIcon />
  </ControlButton>
</Controls>
```

---

## ControlButton

A button component for use inside `<Controls>`.

```tsx
import { ControlButton } from '@xyflow/react';

<ControlButton onClick={handleClick} title="My custom button">
  <svg>...</svg>
</ControlButton>
```

Props: `onClick`, `title`, `className`, `style`, and all standard `<button>` attributes.

---

## MiniMap

Bird's-eye overview of the entire flow.

```tsx
import { MiniMap } from '@xyflow/react';

<MiniMap
  position="bottom-right"              // PanelPosition, default: 'bottom-right'
  pannable={false}                     // allow panning by dragging inside minimap
  zoomable={false}                     // allow zooming by scrolling in minimap
  nodeColor="#e2e2e2"                  // string | (node) => string
  nodeStrokeColor="transparent"        // string | (node) => string
  nodeClassName=""                     // string | (node) => string
  nodeBorderRadius={5}
  nodeStrokeWidth={2}
  bgColor=""                           // minimap background
  maskColor="rgba(240,240,240,0.6)"    // non-visible area overlay
  maskStrokeColor="transparent"
  maskStrokeWidth={1}
  ariaLabel="Mini Map"                 // null to hide from screen readers
  offsetScale={5}
  zoomStep={10}
  inversePan={false}
  onClick={(event, position) => {}}    // click on minimap
  onNodeClick={(event, node) => {}}    // click on minimap node
  nodeComponent={CustomMiniMapNode}    // custom SVG node renderer
/>
```

**Custom node color by type**:

```tsx
function nodeColor(node: Node) {
  switch (node.type) {
    case 'input': return '#6ede87';
    case 'output': return '#6865a5';
    default: return '#ff0072';
  }
}

<MiniMap nodeColor={nodeColor} />
```

**Custom node component** (must return SVG):

```tsx
function MiniMapNode({ x, y, width, height, style, selected }) {
  return (
    <rect
      x={x} y={y} width={width} height={height}
      fill={selected ? 'blue' : '#eee'}
      stroke="#ccc"
    />
  );
}

<MiniMap nodeComponent={MiniMapNode} />
```

---

## Panel

Absolutely-positioned overlay that stays fixed during pan/zoom.

```tsx
import { Panel } from '@xyflow/react';

// PanelPosition: 'top-left' | 'top-center' | 'top-right'
//                'bottom-left' | 'bottom-center' | 'bottom-right'
//                'center-left' | 'center-right'

<Panel position="top-right">
  <button onClick={handleSave}>Save</button>
  <button onClick={handleLoad}>Load</button>
</Panel>
```

Accepts all standard `<div>` attributes.

---

## Handle

Connection point on a custom node. Place inside your custom node component.

```tsx
import { Handle, Position } from '@xyflow/react';

// Position enum: Top, Right, Bottom, Left

<Handle
  type="source"                     // 'source' | 'target'
  position={Position.Right}         // Position enum or 'top'|'right'|'bottom'|'left'
  id="handle-a"                     // required when node has multiple handles of same type
  isConnectable={true}              // can connections be made?
  isConnectableStart={true}         // can connection drag start from here?
  isConnectableEnd={true}           // can connection drop end here?
  isValidConnection={(connection) => connection.source !== connection.target}
  onConnect={(connection) => {}}
  style={{ background: '#555' }}
  className=""
/>
```

**Multiple handles on one node**:

```tsx
function MultiHandleNode() {
  return (
    <>
      <Handle type="target" position={Position.Top} id="in-top" />
      <Handle type="target" position={Position.Left} id="in-left" />
      <div>My Node</div>
      <Handle type="source" position={Position.Bottom} id="out-bottom" />
      <Handle type="source" position={Position.Right} id="out-right" />
    </>
  );
}
```

Reference in edge: `{ ..., sourceHandle: 'out-right', targetHandle: 'in-top' }`

**Hiding handles**: Use `opacity: 0` or `visibility: hidden` — **never `display: none`** (React Flow needs dimensions).

**CSS classes applied by React Flow**:
- `react-flow__handle-connecting` / `connectingto` / `connectingfrom` — during connection drag
- `valid` — when connection would be valid

---

## NodeToolbar

Toolbar that floats above/around a node. Only visible when node is selected (by default).

```tsx
import { NodeToolbar } from '@xyflow/react';

// Use inside a custom node component
function MyNode({ data }) {
  return (
    <>
      <NodeToolbar
        position={Position.Top}    // Position enum, default: Top
        offset={10}                // px gap between node and toolbar
        isVisible={data.alwaysShow}  // override selection-based visibility
        align="center"             // 'start' | 'center' | 'end'
        nodeId={['a', 'b']}        // array to show shared toolbar for group
      >
        <button>Edit</button>
        <button>Delete</button>
        <button>Copy</button>
      </NodeToolbar>

      <Handle type="target" position={Position.Left} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
```

Does not scale with viewport zoom.

---

## NodeResizer

Resize handles for resizable custom nodes.

```tsx
import { NodeResizer } from '@xyflow/react';

function ResizableNode({ data, selected }) {
  return (
    <>
      <NodeResizer
        isVisible={selected}         // show only when selected (recommended)
        minWidth={100}
        minHeight={30}
        maxWidth={500}
        maxHeight={400}
        keepAspectRatio={false}
        color="#ff0071"
        handleClassName=""
        handleStyle={{}}
        lineClassName=""
        lineStyle={{}}
        autoScale={true}             // scale handles with zoom
        shouldResize={(event, params) => true}  // conditional resize
        onResizeStart={(event, params) => {}}
        onResize={(event, params) => {}}        // { x, y, width, height, direction }
        onResizeEnd={(event, params) => {}}
      />
      <Handle type="target" position={Position.Left} />
      <div style={{ padding: 10 }}>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
```

---

## NodeResizeControl

Lower-level single resize handle (used internally by `NodeResizer`).

```tsx
import { NodeResizeControl } from '@xyflow/react';

<NodeResizeControl
  position="bottom-right"  // resize direction
  minWidth={50}
  minHeight={50}
  onResize={onResize}
/>
```

---

## BaseEdge

Core SVG edge renderer for custom edge components.

```tsx
import { BaseEdge } from '@xyflow/react';

// Use inside a custom edge component
function CustomEdge(props: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath(props);

  return (
    <BaseEdge
      path={edgePath}               // REQUIRED: SVG path string
      id={props.id}
      markerStart="url(#arrow)"     // SVG marker id
      markerEnd="url(#arrow)"       // SVG marker id
      label={props.label}           // ReactNode for inline SVG label
      labelX={labelX}
      labelY={labelY}
      labelStyle={{}}
      labelShowBg={true}
      labelBgStyle={{}}
      labelBgPadding={[2, 4]}
      labelBgBorderRadius={2}
      interactionWidth={20}         // invisible hit area width
      style={{ strokeWidth: 2 }}    // SVG path style
    />
  );
}
```

---

## EdgeLabelRenderer

Portal for rendering HTML/React content alongside edges. Use inside custom edge components.

```tsx
import { EdgeLabelRenderer, BaseEdge, getBezierPath } from '@xyflow/react';

function CustomEdge({ id, data, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            // REQUIRED transform to position label at center of edge
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            background: '#ffcc00',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 12,
            pointerEvents: 'all',  // enable mouse events on label
          }}
          className="nodrag nopan"   // prevent drag/pan
        >
          {data?.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
```

Props: only `children: ReactNode`.

Labels render outside the SVG — no SVG restrictions. Use `pointerEvents: 'all'` to make interactive.

---

## EdgeText

SVG text label for use inside edge SVG path elements (no HTML).

```tsx
import { EdgeText } from '@xyflow/react';

// Inside SVG-based custom edge (no EdgeLabelRenderer needed for simple text)
function SimpleTextEdge({ id, labelX, labelY, label, ...props }) {
  const [edgePath] = getBezierPath(props);
  return (
    <g>
      <path d={edgePath} stroke="#b1b1b7" strokeWidth={1} fill="none" />
      <EdgeText
        x={labelX}
        y={labelY}
        label={label}
        labelStyle={{ fill: '#333' }}
        labelShowBg={true}
        labelBgStyle={{ fill: 'white' }}
        labelBgPadding={[2, 4]}
        labelBgBorderRadius={2}
      />
    </g>
  );
}
```

---

## EdgeToolbar

Toolbar anchored to a specific position along an edge. Only visible when edge is selected (default).

```tsx
import { EdgeToolbar, BaseEdge, getBezierPath } from '@xyflow/react';

function CustomEdge(props: EdgeProps) {
  const [edgePath, centerX, centerY] = getBezierPath(props);

  return (
    <>
      <BaseEdge id={props.id} path={edgePath} />
      <EdgeToolbar
        edgeId={props.id}    // REQUIRED: must be attached to an edge
        x={centerX}          // x position
        y={centerY}          // y position
        alignX="center"      // 'left' | 'center' | 'right'
        alignY="center"      // 'top' | 'center' | 'bottom'
        isVisible={false}    // override: show even when not selected
      >
        <button>Delete</button>
      </EdgeToolbar>
    </>
  );
}
```

---

## ViewportPortal

Renders children inside the viewport (they pan/zoom with the canvas). Unlike `Panel`, these elements move with the flow.

```tsx
import { ViewportPortal } from '@xyflow/react';

<ReactFlow ...>
  <ViewportPortal>
    {/* This div moves/scales with the canvas */}
    <div style={{ position: 'absolute', top: 0, left: 0 }}>
      Positioned in flow coordinates
    </div>
  </ViewportPortal>
</ReactFlow>
```

Use for annotations, overlays, or elements that should be part of the flow canvas.
