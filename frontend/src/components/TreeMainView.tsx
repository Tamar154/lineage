import {
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Node,
  type Edge,
  type NodeMouseHandler,
  type NodeTypes,
} from "@xyflow/react";
import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import type { Relationship } from "../services/graphService";
import type { Person } from "../services/personService";
import { layoutTree } from "../utils/treeLayout";
import styles from "../styles/TreeMainView.module.css";

type Props = {
  persons: Person[];
  relationships: Relationship[];
  onSelectPerson: (person: Person) => void;
  onOpenCreatePerson: () => void;
};

// PersonNode
// Handles:
//   top    TARGET  - receives parent→child edge from above
//   right  SOURCE  - sends right to union dot (left spouse)
//   left   TARGET  - receives from union dot (right spouse)
//   bottom SOURCE  - sends parent→child edge downward (solo parent only)
const PersonNode = ({ data }: { data: { fullName: string } }) => (
  <div className={styles.personNode}>
    <Handle
      type="target"
      position={Position.Top}
      id="top"
      className={styles.hiddenHandle}
    />
    <Handle
      type="source"
      position={Position.Right}
      id="right"
      className={styles.hiddenHandle}
    />
    <Handle
      type="target"
      position={Position.Left}
      id="left"
      className={styles.hiddenHandle}
    />
    <Handle
      type="source"
      position={Position.Bottom}
      id="bottom"
      className={styles.hiddenHandle}
    />
    <span className={styles.name}>{data.fullName}</span>
  </div>
);

// UnionNode
// Handles:
//   l (left)  TARGET  - receives edge from left spouse's right
//   r (right) SOURCE  - sends edge to right spouse's left
//   top       TARGET  - receives parent→child edge from above (when couple is a child)
//   bottom    SOURCE  - sends parent→child edges to children
const UnionNode = () => (
  <div className={styles.unionNode}>
    <Handle
      type="target"
      position={Position.Left}
      id="l"
      className={styles.hiddenHandle}
    />
    <Handle
      type="source"
      position={Position.Right}
      id="r"
      className={styles.hiddenHandle}
    />
    <Handle
      type="target"
      position={Position.Top}
      id="top"
      className={styles.hiddenHandle}
    />
    <Handle
      type="source"
      position={Position.Bottom}
      id="bottom"
      className={styles.hiddenHandle}
    />
  </div>
);

const nodeTypes: NodeTypes = { person: PersonNode, union: UnionNode };

const TreeMainView = ({
  persons,
  relationships,
  onSelectPerson,
  onOpenCreatePerson,
}: Props) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    let cancelled = false;
    layoutTree(persons, relationships).then(({ nodes: n, edges: e }) => {
      if (cancelled) return;
      setNodes(n);
      setEdges(e);
    });
    return () => {
      cancelled = true;
    };
  }, [persons, relationships]);

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    if (node.type !== "person") return;
    const clicked = persons.find((p) => p.id === node.id);
    if (clicked) onSelectPerson(clicked);
  };

  return (
    <div className={styles.wrapper}>
      <button className={styles.addPersonBtn} onClick={onOpenCreatePerson}>
        <FaPlus />
        <span>Add Person</span>
      </button>

      {persons.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No people in this tree yet.</p>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesConnectable={false}
          nodesDraggable={false}
          elementsSelectable
        >
          <Controls />
        </ReactFlow>
      )}
    </div>
  );
};

export default TreeMainView;
