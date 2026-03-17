# React Flow v12 — Layouting Reference

> TOC: [Overview](#overview) | [Dagre](#dagre-dagrejs-dagre) | [ELK (elkjs)](#elk-elkjs) | [D3-Hierarchy](#d3-hierarchy) | [D3-Force](#d3-force) | [Sub-Flows](#sub-flows) | [useNodesInitialized Pattern](#usesnodesinitalized-pattern)

React Flow does not include built-in layout algorithms. Use external libraries to position nodes.

---

## Overview

Library comparison:

| Library | Dynamic Sizes | Sub-flows | Edge Routing | Bundle Size | Async |
|---------|:---:|:---:|:---:|:---:|:---:|
| `@dagrejs/dagre` | Yes | Partial* | No | ~40KB | No |
| `elkjs` | Yes | Yes | Yes | ~1.5MB | Yes |
| `d3-hierarchy` | No | No | No | ~15KB | No |
| `d3-force` | Yes | No | No | ~16KB | No |

*Dagre has an open issue with sub-flow nodes that connect outside the sub-flow.

**Recommendation**: Use Dagre for most tree/DAG use cases. Use ELK when you need edge routing or complex sub-flow layouts. Use d3-hierarchy for uniform-sized tree displays. Use d3-force for physics-based organic layouts.

---

## Dagre (`@dagrejs/dagre`)

Install: `npm install @dagrejs/dagre`

### getLayoutedElements (synchronous)

```tsx
import dagre from '@dagrejs/dagre';
import { type Node, type Edge, Position } from '@xyflow/react';

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

type Direction = 'TB' | 'LR';

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: Direction = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const isHorizontal = direction === 'LR';

  dagreGraph.setGraph({ rankdir: direction });

  // Register all nodes with dimensions
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Register all edges
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run layout
  dagre.layout(dagreGraph);

  // Map dagre positions back to React Flow nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    return {
      ...node,
      // Adjust from center anchor to top-left anchor
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      // Set handle positions based on direction
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

### Component Integration

```tsx
import { useCallback } from 'react';
import {
  ReactFlow, Background, Controls, Panel,
  useNodesState, useEdgesState, addEdge,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 0, y: 0 }, data: { label: 'Node 2' } },
  { id: '3', position: { x: 0, y: 0 }, data: { label: 'Node 3' } },
];
const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' },
];

// Run initial layout
const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
  initialNodes,
  initialEdges,
  'TB'
);

export default function DagreLayout() {
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true }, eds)),
    []
  );

  // Re-layout when direction changes
  const onLayout = useCallback(
    (direction: Direction) => {
      const { nodes: ln, edges: le } = getLayoutedElements(nodes, edges, direction);
      setNodes([...ln]);
      setEdges([...le]);
    },
    [nodes, edges]
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

### With Actual Node Dimensions

When your custom nodes have variable sizes, use `node.measured.width` / `node.measured.height`:

```tsx
function getLayoutedElements(nodes: Node[], edges: Edge[], direction: Direction = 'TB') {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: node.measured?.width ?? 150,
      height: node.measured?.height ?? 40,
    });
  });

  edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const { x, y } = dagreGraph.node(node.id);
    const w = node.measured?.width ?? 150;
    const h = node.measured?.height ?? 40;

    return {
      ...node,
      position: { x: x - w / 2, y: y - h / 2 },
      targetPosition: direction === 'LR' ? Position.Left : Position.Top,
      sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

### Dagre Graph Options

```typescript
dagreGraph.setGraph({
  rankdir: 'TB',    // 'TB' | 'LR' | 'BT' | 'RL'
  align: 'UL',      // 'UL' | 'UR' | 'DL' | 'DR' | undefined
  nodesep: 50,      // horizontal separation between nodes
  ranksep: 50,      // vertical separation between ranks
  ranker: 'network-simplex',  // 'network-simplex' | 'tight-tree' | 'longest-path'
  marginx: 20,      // margin around graph x
  marginy: 20,      // margin around graph y
});
```

---

## ELK (elkjs)

Install: `npm install elkjs`
Note: elkjs is ~1.5MB. Use dynamic import for code-splitting in production.

### Async Layout Hook

```tsx
import ELK from 'elkjs/lib/elk.bundled.js';
import { useCallback, useLayoutEffect } from 'react';
import {
  ReactFlow, Background, Controls, Panel,
  useNodesState, useEdgesState, useReactFlow,
  ReactFlowProvider, addEdge,
  type Node, type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const elk = new ELK();

const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
};

async function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: Record<string, string> = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const isHorizontal = options?.['elk.direction'] === 'RIGHT';

  const graph = {
    id: 'root',
    layoutOptions: options,
    children: nodes.map((node) => ({
      ...node,
      // ELK expects width and height
      width: node.measured?.width ?? 150,
      height: node.measured?.height ?? 50,
      // ELK handle layout
      ports: [
        { id: `${node.id}-target`, properties: { side: isHorizontal ? 'WEST' : 'NORTH' } },
        { id: `${node.id}-source`, properties: { side: isHorizontal ? 'EAST' : 'SOUTH' } },
      ],
    })),
    edges: edges.map((edge) => ({
      ...edge,
      sources: [`${edge.source}-source`],
      targets: [`${edge.target}-target`],
    })),
  };

  const layoutedGraph = await elk.layout(graph);

  return {
    nodes: nodes.map((node) => {
      const layoutedNode = layoutedGraph.children?.find((n) => n.id === node.id);
      return {
        ...node,
        position: {
          x: layoutedNode?.x ?? 0,
          y: layoutedNode?.y ?? 0,
        },
        targetPosition: isHorizontal ? Position.Left : Position.Top,
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      };
    }),
    edges,
  };
}

function useLayoutedElements() {
  const { getNodes, getEdges, setNodes, setEdges, fitView } = useReactFlow();

  const onLayout = useCallback(
    ({ direction, useInitialNodes = false }: { direction: string; useInitialNodes?: boolean }) => {
      const opts = { 'elk.direction': direction, ...elkOptions };
      const nodes = useInitialNodes ? initialNodes : getNodes();
      const edges = useInitialNodes ? initialEdges : getEdges();

      getLayoutedElements(nodes, edges, opts).then(({ nodes: ln, edges: le }) => {
        setNodes(ln);
        setEdges(le);
        window.requestAnimationFrame(() => fitView());
      });
    },
    [getNodes, getEdges, setNodes, setEdges, fitView]
  );

  return { onLayout };
}
```

### ELK Layout Options

```typescript
// Common ELK layout options
const elkOptions = {
  // Algorithm
  'elk.algorithm': 'layered',  // 'layered' | 'force' | 'stress' | 'mrtree' | 'radial' | 'box'

  // Direction
  'elk.direction': 'DOWN',  // 'DOWN' | 'UP' | 'RIGHT' | 'LEFT'

  // Spacing
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.edgeNode': '40',
  'elk.spacing.edgeEdge': '20',

  // Edge routing
  'elk.edgeRouting': 'ORTHOGONAL',  // 'UNDEFINED' | 'POLYLINE' | 'ORTHOGONAL' | 'SPLINES'

  // Node placement
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
};
```

### ELK Component with ReactFlowProvider

```tsx
// ELK hooks need useReactFlow — wrap in ReactFlowProvider
function LayoutFlow() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const { onLayout } = useLayoutedElements();

  // Run initial layout after mount
  useLayoutEffect(() => {
    onLayout({ direction: 'DOWN', useInitialNodes: true });
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
    >
      <Background />
      <Panel position="top-right">
        <button onClick={() => onLayout({ direction: 'DOWN' })}>Vertical</button>
        <button onClick={() => onLayout({ direction: 'RIGHT' })}>Horizontal</button>
      </Panel>
    </ReactFlow>
  );
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlowProvider>
        <LayoutFlow />
      </ReactFlowProvider>
    </div>
  );
}
```

---

## D3-Hierarchy

Install: `npm install d3-hierarchy`

Best for: uniform-sized tree structures with a single root.

### Synchronous Tree Layout

```tsx
import { hierarchy, tree, type HierarchyPointNode } from 'd3-hierarchy';
import { type Node, type Edge, Position } from '@xyflow/react';

type TreeNode = {
  id: string;
  children?: TreeNode[];
};

const nodeWidth = 172;
const nodeHeight = 36;

// Build hierarchy from nodes/edges
function buildHierarchy(nodes: Node[], edges: Edge[]): TreeNode {
  const nodeMap = new Map(nodes.map((n) => [n.id, { id: n.id, children: [] as TreeNode[] }]));

  edges.forEach((edge) => {
    const parent = nodeMap.get(edge.source);
    const child = nodeMap.get(edge.target);
    if (parent && child) parent.children?.push(child);
  });

  // Find root (no incoming edges)
  const childIds = new Set(edges.map((e) => e.target));
  const root = nodes.find((n) => !childIds.has(n.id));
  return nodeMap.get(root!.id)!;
}

function getLayoutedElements(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const root = hierarchy(buildHierarchy(nodes, edges));

  const treeLayout = tree<TreeNode>()
    .nodeSize([nodeWidth * 1.5, nodeHeight * 2.5])
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.5));

  const layoutedRoot = treeLayout(root);

  const flatNodes: HierarchyPointNode<TreeNode>[] = [];
  layoutedRoot.each((node) => flatNodes.push(node));

  const layoutedNodes = flatNodes.map((d) => {
    const originalNode = nodes.find((n) => n.id === d.data.id)!;
    return {
      ...originalNode,
      position: {
        x: d.x - nodeWidth / 2,
        y: d.y,
      },
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

---

## D3-Force

Install: `npm install d3-force`

Best for: physics-based organic layouts, relationship visualizations.

### Force Layout Hook (Iterative/Async)

```tsx
import {
  forceSimulation, forceLink, forceManyBody, forceX, forceY,
  forceCollide, type SimulationNodeDatum,
} from 'd3-force';
import { useEffect, useRef } from 'react';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';

type SimNode = SimulationNodeDatum & Node;

export function useForceLayout({
  strength = -1000,
  distance = 150,
}: {
  strength?: number;
  distance?: number;
} = {}) {
  const { getNodes, setNodes, getEdges, fitView } = useReactFlow();
  const simulationRef = useRef<ReturnType<typeof forceSimulation> | null>(null);

  useEffect(() => {
    const nodes = getNodes() as SimNode[];
    const edges = getEdges();

    const simulation = forceSimulation(nodes)
      .force(
        'link',
        forceLink(edges)
          .id((d: any) => d.id)
          .strength(0.05)
          .distance(distance)
      )
      .force('charge', forceManyBody().strength(strength))
      .force('x', forceX())
      .force('y', forceY())
      .force(
        'collide',
        // Rectangular collision using measured dimensions
        forceCollide().radius((d: any) => {
          const w = d.measured?.width ?? 150;
          const h = d.measured?.height ?? 40;
          return Math.sqrt(w * w + h * h) / 2;
        })
      )
      .on('tick', () => {
        setNodes((nds) =>
          nds.map((n) => {
            const simNode = nodes.find((sn) => sn.id === n.id);
            return simNode
              ? { ...n, position: { x: simNode.x ?? 0, y: simNode.y ?? 0 } }
              : n;
          })
        );
      })
      .on('end', () => fitView());

    simulationRef.current = simulation;

    return () => { simulation.stop(); };
  }, []); // Run once on mount

  // Control: run/pause
  const toggle = () => {
    const sim = simulationRef.current;
    if (!sim) return;
    if (sim.alpha() < 0.05) {
      sim.alpha(0.3).restart();
    } else {
      sim.stop();
    }
  };

  return { toggle };
}
```

---

## Sub-Flows

Sub-flows embed nodes inside other nodes. Uses `parentId` property on child nodes.

### Parent Node Setup

```tsx
// Parent node — use 'group' type for no-handle container
const parentNode: Node = {
  id: 'parent-A',
  type: 'group',          // built-in type: no handles, no label
  position: { x: 0, y: 0 },
  style: {
    width: 400,
    height: 300,
    border: '2px dashed #aaa',
    borderRadius: 8,
    backgroundColor: 'rgba(200,200,200,0.1)',
  },
  data: {},
};

// Child node — position relative to parent's top-left
const childNode: Node = {
  id: 'child-1',
  position: { x: 20, y: 40 },  // relative to parent
  parentId: 'parent-A',         // REQUIRED: must match parent id
  extent: 'parent',             // REQUIRED if child should stay within parent bounds
  data: { label: 'Child' },
};

// CRITICAL: Parent nodes MUST appear before children in the array
const nodes = [parentNode, childNode];
```

### extent Options

```typescript
// 'parent' — child stays within parent bounds during drag
{ extent: 'parent' }

// CoordinateExtent — restrict to specific coordinate range
{ extent: [[0, 0], [200, 200]] }

// null/undefined — child can be dragged outside parent (but moves with parent)
{ extent: undefined }
```

### expandParent

```tsx
// expandParent: true — parent auto-expands when child dragged to edge
const childNode: Node = {
  id: 'child-1',
  parentId: 'parent-A',
  expandParent: true,     // parent grows when this node is dragged toward edge
  data: {},
  position: { x: 10, y: 10 },
};
```

### Custom Parent Node

```tsx
// Any node type can be a parent — not limited to 'group'
const customParent: Node = {
  id: 'parent',
  type: 'myCustomNode',  // custom node with handles
  position: { x: 0, y: 0 },
  style: { width: 300, height: 200 },
  data: { label: 'Container' },
};

// Children of custom parent work the same way
const child: Node = {
  id: 'child',
  parentId: 'parent',
  extent: 'parent',
  position: { x: 50, y: 50 },
  data: { label: 'Inside' },
};
```

### Edges in Sub-Flows

```tsx
// Edges between siblings (within same parent) — normal edge
const internalEdge: Edge = {
  id: 'e-internal',
  source: 'child-1',
  target: 'child-2',
  // Renders above nodes (not below)
};

// Edge crossing parent boundary — also works normally
const crossEdge: Edge = {
  id: 'e-cross',
  source: 'child-1',
  target: 'external-node',
};

// If edge z-index is wrong, adjust defaultEdgeOptions
<ReactFlow defaultEdgeOptions={{ zIndex: 1 }} ... />
```

### Sub-Flow with Dagre

```tsx
// When using dagre with sub-flows, layout children separately
function layoutSubFlow(
  parentId: string,
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  const children = nodes.filter((n) => n.parentId === parentId);
  const childEdges = edges.filter(
    (e) =>
      children.some((n) => n.id === e.source) &&
      children.some((n) => n.id === e.target)
  );

  const { nodes: layoutedChildren } = getLayoutedElements(children, childEdges, 'TB');

  return {
    nodes: nodes.map((n) => layoutedChildren.find((ln) => ln.id === n.id) ?? n),
    edges,
  };
}
```

---

## useNodesInitialized Pattern

Run layout after all nodes are measured (have width/height). Essential for layouts that require real node dimensions.

```tsx
import { useEffect } from 'react';
import { useNodesInitialized, useReactFlow } from '@xyflow/react';

function useAutoLayout() {
  const nodesInitialized = useNodesInitialized();
  const { getNodes, getEdges, setNodes, fitView } = useReactFlow();

  useEffect(() => {
    if (!nodesInitialized) return;

    const nodes = getNodes();
    const edges = getEdges();

    // Now nodes have measured.width and measured.height
    const { nodes: layoutedNodes } = getLayoutedElements(nodes, edges, 'TB');
    setNodes(layoutedNodes);

    // Fit view after layout
    window.requestAnimationFrame(() => fitView({ duration: 300 }));
  }, [nodesInitialized]);
}
```

Notes:
- `useNodesInitialized` returns `false` when nodes array is empty
- Only fires once — when all nodes transition from unmeasured to measured
- Includes hidden nodes only if `{ includeHiddenNodes: true }` is passed

### Full Auto-Layout on Init Pattern

```tsx
import {
  ReactFlow, ReactFlowProvider,
  useNodesState, useEdgesState,
  useNodesInitialized, useReactFlow,
} from '@xyflow/react';
import { useEffect } from 'react';

function LayoutOnInit() {
  const [nodes, setNodes, onNodesChange] = useNodesState(rawNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rawEdges);
  const nodesInitialized = useNodesInitialized();
  const { getNodes, getEdges, fitView } = useReactFlow();
  const [hasLayouted, setHasLayouted] = useState(false);

  useEffect(() => {
    if (nodesInitialized && !hasLayouted) {
      const { nodes: ln } = getLayoutedElements(getNodes(), getEdges(), 'TB');
      setNodes(ln);
      setHasLayouted(true);
      requestAnimationFrame(() => fitView({ duration: 500 }));
    }
  }, [nodesInitialized]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
    />
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <LayoutOnInit />
    </ReactFlowProvider>
  );
}
```
