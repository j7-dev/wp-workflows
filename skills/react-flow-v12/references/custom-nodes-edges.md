# React Flow v12 — Custom Nodes & Edges

> TOC: [Custom Nodes](#custom-nodes) | [Handle Patterns](#handle-patterns) | [Custom Edges](#custom-edges) | [Edge Path Utilities](#edge-path-utilities) | [Edge Labels & Buttons](#edge-labels--buttons) | [Performance: memo](#performance-memo)

---

## Custom Nodes

### Anatomy

```tsx
import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

// 1. Define data type
type MyNodeData = {
  label: string;
  value: number;
  color?: string;
};
type MyNode = Node<MyNodeData, 'myNode'>;

// 2. Write the component
// Wrap with memo to prevent unnecessary re-renders
const MyCustomNode = memo(function MyCustomNode({
  id,
  data,
  selected,
  isConnectable,
  positionAbsoluteX,
  positionAbsoluteY,
}: NodeProps<MyNode>) {
  return (
    // The wrapper div IS the node — style it however you want
    <div style={{
      background: data.color ?? '#fff',
      border: `2px solid ${selected ? '#0041d0' : '#ccc'}`,
      borderRadius: 8,
      padding: '10px 20px',
      minWidth: 150,
    }}>
      {/* Handles MUST be inside the component */}
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />

      <div className="node-label">{data.label}</div>
      <div className="node-value">Value: {data.value}</div>

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
});

// 3. Register — OUTSIDE component or useMemo to prevent re-render loops!
const nodeTypes = {
  myNode: MyCustomNode,
};

// 4. Use
const nodes = [
  {
    id: '1',
    type: 'myNode',        // must match nodeTypes key
    position: { x: 100, y: 100 },
    data: { label: 'Node A', value: 42, color: '#e8f4f8' },
  },
];

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow nodes={nodes} edges={[]} nodeTypes={nodeTypes} />
    </div>
  );
}
```

### All NodeProps Fields

```typescript
// Full list of props available in custom nodes:
{
  id: string,                    // node ID
  data: NodeData,                // your custom data
  type: string,                  // node type key
  width: number | undefined,     // measured width
  height: number | undefined,    // measured height
  selected: boolean,             // is node selected?
  dragging: boolean,             // is node being dragged?
  isConnectable: boolean,        // can connections be made?
  draggable: boolean | undefined,
  selectable: boolean | undefined,
  deletable: boolean | undefined,
  sourcePosition: Position | undefined,
  targetPosition: Position | undefined,
  positionAbsoluteX: number,     // absolute X (important for sub-flow children)
  positionAbsoluteY: number,     // absolute Y
  zIndex: number,
  parentId: string | undefined,
  dragHandle: string | undefined,
}
```

### Node with Interactive Elements

Elements inside nodes that should NOT trigger drag need `className="nodrag"`.
Elements that should NOT trigger panning need `className="nopan"`.

```tsx
const InputNode = memo(({ id, data }: NodeProps<InputNodeType>) => {
  const { updateNodeData } = useReactFlow();

  return (
    <div>
      <Handle type="target" position={Position.Left} />
      {/* nodrag prevents input from starting node drag */}
      <input
        className="nodrag"
        value={data.value}
        onChange={(e) => updateNodeData(id, { value: e.target.value })}
      />
      {/* nopan prevents scroll inside select from panning */}
      <select className="nodrag nopan" value={data.type} onChange={...}>
        <option>A</option>
        <option>B</option>
      </select>
      <Handle type="source" position={Position.Right} />
    </div>
  );
});
```

### Node that Reads Other Nodes' Data

```tsx
// Use useNodesData for efficient subscription to specific node data
function ProcessNode({ id, data }: NodeProps<ProcessNodeType>) {
  const connections = useNodeConnections({ handleType: 'target' });
  const inputData = useNodesData(connections.map((c) => c.source));

  const result = useMemo(() => {
    const inputValues = inputData.map((n) => n?.data?.value ?? 0);
    return inputValues.reduce((sum, v) => sum + v, 0);
  }, [inputData]);

  return (
    <div>
      <Handle type="target" position={Position.Left} />
      <div>Sum: {result}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
```

---

## Handle Patterns

### Single Source + Target

```tsx
<Handle type="target" position={Position.Top} />
<Handle type="source" position={Position.Bottom} />
```

### Multiple Handles

When a node has multiple handles of the same type, each needs a unique `id`:

```tsx
function MultiOutputNode() {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div>Multiple Outputs</div>
      {/* Multiple source handles need unique IDs */}
      <Handle type="source" position={Position.Bottom} id="output-a" />
      <Handle type="source" position={Position.Bottom} id="output-b" style={{ left: '70%' }} />
    </>
  );
}

// Then reference in edges:
const edges = [
  { id: 'e1', source: 'node-1', target: 'node-2', sourceHandle: 'output-a' },
  { id: 'e2', source: 'node-1', target: 'node-3', sourceHandle: 'output-b' },
];
```

### Handle Positioning

```tsx
// Position.Top/Right/Bottom/Left with style for exact placement
<Handle
  type="source"
  position={Position.Right}
  id="top-right"
  style={{ top: '20%' }}  // offset from center
/>
<Handle
  type="source"
  position={Position.Right}
  id="bottom-right"
  style={{ top: '80%' }}
/>
```

### Handle Validation

```tsx
// Prevent self-connections and type mismatches
<Handle
  type="target"
  position={Position.Left}
  isValidConnection={(connection) =>
    connection.source !== connection.target &&    // no self-loop
    connection.sourceHandle?.startsWith('data-')  // must come from a data handle
  }
/>
```

### Dynamic Handles

After adding/removing handles programmatically, call `updateNodeInternals`:

```tsx
function DynamicHandleNode({ id }) {
  const [outputs, setOutputs] = useState(['a']);
  const updateNodeInternals = useUpdateNodeInternals();

  const addOutput = () => {
    const newId = `output-${Date.now()}`;
    setOutputs((prev) => [...prev, newId]);
    updateNodeInternals(id);  // sync React Flow's handle registry
  };

  return (
    <>
      <Handle type="target" position={Position.Left} />
      {outputs.map((id) => (
        <Handle key={id} type="source" position={Position.Right} id={id} />
      ))}
      <button onClick={addOutput}>Add Output</button>
    </>
  );
}
```

---

## Custom Edges

### Anatomy

```tsx
import { memo } from 'react';
import {
  BaseEdge, EdgeLabelRenderer, getBezierPath,
  type EdgeProps, type Edge
} from '@xyflow/react';

// 1. Define data type
type MyEdge = Edge<{ label: string; weight: number }, 'myEdge'>;

// 2. Write the component
const MyCustomEdge = memo(function MyCustomEdge({
  id,
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  data,
  selected,
  animated,
  markerEnd,
  style,
}: EdgeProps<MyEdge>) {
  // Compute SVG path
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      {/* BaseEdge renders the SVG path */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, stroke: selected ? '#0041d0' : '#b1b1b7' }}
      />

      {/* EdgeLabelRenderer renders HTML over the edge */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            fontSize: 12,
            background: 'white',
            padding: '2px 6px',
            borderRadius: 4,
            border: '1px solid #ccc',
            pointerEvents: 'all',  // enable click on label
          }}
          className="nodrag nopan"
        >
          {data?.label} ({data?.weight})
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

// 3. Register
const edgeTypes = { myEdge: MyCustomEdge };

// 4. Use
const edges = [
  {
    id: 'e1', source: 'n1', target: 'n2',
    type: 'myEdge',
    data: { label: 'Connection', weight: 5 },
  },
];
```

### Edge with Delete Button

```tsx
const EdgeWithDeleteButton = memo(function EdgeWithDeleteButton(props: EdgeProps) {
  const { id, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition } = props;
  const { deleteElements } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <button
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            background: '#eee',
            border: '1px solid #aaa',
            borderRadius: '50%',
            width: 20,
            height: 20,
            cursor: 'pointer',
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onClick={() => deleteElements({ edges: [{ id }] })}
        >
          x
        </button>
      </EdgeLabelRenderer>
    </>
  );
});
```

### Custom SVG Path Edge

```tsx
function SineWaveEdge({ sourceX, sourceY, targetX, targetY, id }: EdgeProps) {
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;

  // Quadratic bezier with custom control point
  const path = `M ${sourceX},${sourceY} Q ${centerX},${sourceY - 50} ${centerX},${centerY} Q ${centerX},${centerY + 50} ${targetX},${targetY}`;

  return <BaseEdge id={id} path={path} />;
}
```

---

## Edge Path Utilities

All path functions return `[path, labelX, labelY, offsetX, offsetY]`:

```typescript
// Bezier curve (default for 'default' edge type)
const [path, labelX, labelY] = getBezierPath({
  sourceX, sourceY, sourcePosition,    // sourcePosition = Position.Bottom (default)
  targetX, targetY, targetPosition,    // targetPosition = Position.Top (default)
  curvature: 0.25,                     // curve intensity (default: 0.25)
});

// Smooth step (right angles with rounded corners)
const [path] = getSmoothStepPath({
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  borderRadius: 5,                     // 0 = sharp corners (default: 5)
  offset: 20,                          // routing offset (default: 20)
  stepPosition: 0.5,                   // where bend occurs 0-1 (default: 0.5)
});

// Straight line
const [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });

// Simple bezier (less pronounced curve)
const [path] = getSimpleBezierPath({
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
});
```

---

## Edge Labels & Buttons

### Position Label at Center

```tsx
// getBezierPath returns [path, labelX, labelY] — labelX/Y is the center
const [edgePath, labelX, labelY] = getBezierPath(props);

<EdgeLabelRenderer>
  <div
    style={{
      position: 'absolute',
      // This transform centers the label at labelX, labelY
      transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
    }}
    className="nodrag nopan"
  >
    Label content
  </div>
</EdgeLabelRenderer>
```

### EdgeToolbar Alternative

```tsx
// EdgeToolbar positions itself based on x/y — use for toolbar-style buttons
<EdgeToolbar
  edgeId={id}
  x={labelX}
  y={labelY}
  isVisible={selected}  // or always visible
>
  <button onClick={handleEdit}>Edit</button>
  <button onClick={handleDelete}>Delete</button>
</EdgeToolbar>
```

---

## Performance: memo

Always wrap custom node/edge components with `React.memo`. React Flow renders them often during pan/zoom/drag.

```tsx
import { memo } from 'react';

// Good
const MyNode = memo(function MyNode({ data }: NodeProps<MyNodeType>) {
  return <div>{data.label}</div>;
});

// Good — with custom comparison
const MyExpensiveNode = memo(
  function MyExpensiveNode({ data }: NodeProps<MyNodeType>) {
    return <div>{data.label}</div>;
  },
  (prev, next) => prev.data.label === next.data.label  // skip re-render if label unchanged
);
```

Also memoize `nodeTypes` and `edgeTypes`:

```tsx
// Outside component — no memo needed, stable reference
const nodeTypes = { myNode: MyNode };

// OR inside component with useMemo
export default function App() {
  const nodeTypes = useMemo(() => ({ myNode: MyNode }), []);
  return <ReactFlow nodeTypes={nodeTypes} ... />;
}
```
