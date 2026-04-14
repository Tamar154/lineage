import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getTreeById, type Tree } from "../services/treeService";
import PersonDetailsPanel from "../components/PersonDetailsPanel";
import TreeMainView from "../components/TreeMainView";
import TreeSidebar from "../components/TreeSidebar";
import styles from "../styles/TreePage.module.css";
import {
  createPerson,
  deletePerson,
  getAllPersons,
  updatePerson,
  type Person,
} from "../services/personService";
import PersonFormModal from "../components/PersonFormModal";
import type { PersonFormData } from "../types/PersonFormData";
import AddRelationshipModal from "../components/AddRelationshipModal";

const TreePage = () => {
  const { treeId } = useParams();
  const [tree, setTree] = useState<Tree | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showCreatePersonModal, setShowCreatePersonModal] = useState(false);
  const [showEditPersonModal, setShowEditPersonModal] = useState(false);
  const [showAddRelModal, setShowAddRelModal] = useState(false);

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

  const handleEditPerson = async (data: PersonFormData) => {
    if (!treeId || !selectedPerson) return;

    try {
      const res = await updatePerson({
        treeId,
        personId: selectedPerson.id,
        data,
      });

      const updatedPerson = res.data;
      const newPersons = persons.map((person) =>
        person.id === selectedPerson.id ? updatedPerson : person,
      );
      setPersons(newPersons);
      setSelectedPerson(updatedPerson);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemovePerson = async () => {
    if (!treeId || !selectedPerson) return;

    const isConfirmed = window.confirm(
      `Are you sure you want to remove ${selectedPerson.firstName} ${selectedPerson.lastName}?`,
    );

    if (!isConfirmed) return;

    try {
      await deletePerson({ treeId, personId: selectedPerson.id });
      const newPersons = persons.filter(
        (person) => person.id !== selectedPerson.id,
      );

      setPersons(newPersons);
      setSelectedPerson(null);
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
        <PersonFormModal
          mode="create"
          onClose={() => setShowCreatePersonModal(false)}
          onSubmit={handleCreatePerson}
        />
      )}

      {showEditPersonModal && selectedPerson && (
        <PersonFormModal
          mode="edit"
          initialData={{
            firstName: selectedPerson.firstName,
            lastName: selectedPerson.lastName,
            birthDate: selectedPerson.birthDate || "",
            deathDate: selectedPerson.deathDate || "",
            bio: selectedPerson.bio || "",
          }}
          onClose={() => setShowEditPersonModal(false)}
          onSubmit={handleEditPerson}
        />
      )}

      {showAddRelModal && selectedPerson && (
        <AddRelationshipModal
          sourcePerson={selectedPerson}
          persons={persons}
          onClose={() => setShowAddRelModal(false)}
        />
      )}

      {selectedPerson && (
        <div className={styles.details}>
          <PersonDetailsPanel
            person={selectedPerson}
            onClosePanel={() => setSelectedPerson(null)}
            onEditPerson={() => setShowEditPersonModal(true)}
            onRemovePerson={handleRemovePerson}
            onAddRelationship={() => setShowAddRelModal(true)}
          />
        </div>
      )}
    </div>
  );
};

export default TreePage;
