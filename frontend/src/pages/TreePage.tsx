import { useState, useEffect, useEffectEvent } from "react";
import { useParams } from "react-router-dom";
import { getTreeById, type Tree } from "../services/treeService";
import PersonDetailsPanel from "../components/PersonDetailsPanel";
import TreeMainView from "../components/TreeMainView";
import TreeSidebar from "../components/TreeSidebar";
import styles from "../styles/TreePage.module.css";
import {
  createPerson,
  getAllPersons,
  type Person,
} from "../services/personService";
import CreatePersonModal from "../components/CreatePersonModal";
import type { PersonFormData } from "../types/PersonFormData";

const TreePage = () => {
  const { treeId } = useParams();
  const [tree, setTree] = useState<Tree | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showCreatePersonModal, setShowCreatePersonModal] = useState(false);

  useEffect(() => {
    if (!treeId) return;

    const fetchTree = async () => {
      try {
        const res = await getTreeById({ treeId });
        setTree(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchPersons = async () => {
      try {
        const res = await getAllPersons({ treeId });
        setPersons(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchTree();
    fetchPersons();
  }, [treeId]);

  if (!tree) {
    return <div>Loading...</div>;
  }

  const handleCreatePerson = async (data: PersonFormData) => {
    if (!treeId) return;

    try {
      const res = await createPerson({ treeId, data });
      setPersons((prev) => [...prev, res.data]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.sidebar}>
        <TreeSidebar treeName={tree.name} persons={persons} />
      </div>
      <div className={styles.main}>
        <TreeMainView
          persons={persons}
          onSelectPerson={setSelectedPerson}
          onOpenCreatePerson={() => setShowCreatePersonModal(true)}
        />
      </div>
      {showCreatePersonModal && (
        <CreatePersonModal
          onClose={() => setShowCreatePersonModal(false)}
          onCreate={handleCreatePerson}
        />
      )}

      {selectedPerson && (
        <div className={styles.details}>
          <PersonDetailsPanel
            person={selectedPerson}
            onClosePanel={() => setSelectedPerson(null)}
          />
        </div>
      )}
    </div>
  );
};

export default TreePage;
