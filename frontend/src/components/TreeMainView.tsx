import {
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import type { Person } from "../services/personService";
import type { GraphRelationship } from "../services/graphService";
import styles from "../styles/TreeMainView.module.css";
import { FaPlus } from "react-icons/fa6";

type Props = {
  persons: Person[];
  relationships: GraphRelationship[];
  onSelectPerson: (person: Person) => void;
  onOpenCreatePerson: () => void;
};

const TreeMainView = ({
  persons,
  relationships,
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

  const edges: Edge[] = relationships.map((relationship) => ({
    id: relationship.id,
    source: relationship.personAId,
    target: relationship.personBId,
    label: relationship.type === "PARENT" ? "Parent" : "Spouse",
    animated: false,
  }));

  const nodeTypes = {
    person: ({ data }: { data: { fullName: string } }) => (
      <div className={styles.personNode}>
        <Handle type="target" position={Position.Top} />
        <div>{data.fullName}</div>
        <Handle type="source" position={Position.Bottom} />
      </div>
    ),
  };

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    const clickedPerson = persons.find((person) => person.id === node.id);
    if (!clickedPerson) return;

    onSelectPerson(clickedPerson);
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
          nodesConnectable={false}
          nodesDraggable={false}
          elementsSelectable={true}
        >
          <Controls />
        </ReactFlow>
      )}
    </div>
  );
};

export default TreeMainView;
