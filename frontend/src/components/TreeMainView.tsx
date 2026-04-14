import {
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import type { Person } from "../services/personService";
import { FaPlus } from "react-icons/fa6";
import styles from "../styles/TreeMainView.module.css";

type Props = {
  persons: Person[];
  onSelectPerson: (person: Person) => void;
  onOpenCreatePerson: () => void;
};

const TreeMainView = ({
  persons,
  onSelectPerson,
  onOpenCreatePerson,
}: Props) => {
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
      <button className={styles.addPersonBtn} onClick={onOpenCreatePerson}>
        <FaPlus />
        <span>Add Person</span>
      </button>

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
