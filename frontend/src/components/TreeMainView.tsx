import {
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import type { Person } from "../services/personService";
import styles from "../styles/TreeMainView.module.css";

type Props = {
  persons: Person[];
  onSelectPerson: (person: Person) => void;
};

const TreeMainView = ({ persons, onSelectPerson }: Props) => {
  const nodes: Node[] = persons.map((person, index) => ({
    id: person.id,
    type: "person",
    position: {
      x: 100 + (index % 4) * 220,
      y: 80 + Math.floor(index / 4) * 140,
    },
    data: {
      fullName: `${person.firstName} ${person.lastName}`,
    },
    draggable: false,
    connectable: false,
    selectable: true,
  }));

  const edges: Edge[] = [];

  const nodeTypes = {
    person: ({ data }: { data: { fullName: string } }) => (
      <div className={styles.personNode}>{data.fullName}</div>
    ),
  };

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    const clickedPerson = persons.find((person) => person.id === node.id);
    if (!clickedPerson) return;

    onSelectPerson(clickedPerson);
  };

  if (persons.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No people in this tree yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        nodesConnectable={false}
        nodesDraggable={false}
        elementsSelectable={true}
      >
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default TreeMainView;
