import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getTreeById, type Tree } from "../services/treeService";
import { createRelationship } from "../services/relationshipService";
import { getGraph, type Relationship } from "../services/graphService";
import {
  createPerson,
  deletePerson,
  updatePerson,
  type Person,
} from "../services/personService";
import PersonDetailsPanel from "../components/PersonDetailsPanel";
import TreeMainView from "../components/TreeMainView";
import TreeSidebar from "../components/TreeSidebar";
import PersonFormModal from "../components/PersonFormModal";
import AddRelationshipModal from "../components/AddRelationshipModal";
import type { PersonFormData } from "../types/PersonFormData";
import styles from "../styles/TreePage.module.css";

const TreePage = () => {
  const { treeId } = useParams();
  const [tree, setTree] = useState<Tree | null>(null);

  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);

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

    fetchTree();
    fetchGraph();
  }, [treeId]);

  const fetchGraph = async () => {
    if (!treeId) return;

    try {
      const res = await getGraph({ treeId });
      setPersons(res.data.persons);
      setRelationships(res.data.relationships);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreatePerson = async (data: PersonFormData) => {
    if (!treeId) return;

    try {
      await createPerson({ treeId, data });
      await fetchGraph();
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
      setSelectedPerson(null);
      await fetchGraph();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateRelationship = async (data: {
    type: "parent" | "child" | "spouse";
    targetPersonId: string;
  }) => {
    if (!treeId || !selectedPerson) return;

    try {
      if (data.type === "spouse") {
        await createRelationship({
          treeId,
          type: "spouse",
          sourcePersonId: selectedPerson.id,
          targetPersonId: data.targetPersonId,
        });
      }

      if (data.type === "parent") {
        await createRelationship({
          treeId,
          type: "parent",
          sourcePersonId: selectedPerson.id, // parent
          targetPersonId: data.targetPersonId, // child
        });
      }

      if (data.type === "child") {
        await createRelationship({
          treeId,
          type: "parent",
          sourcePersonId: data.targetPersonId, // parent
          targetPersonId: selectedPerson.id, // child
        });
      }

      setShowAddRelModal(false);
      await fetchGraph();
    } catch (error) {
      console.error(error);
    }
  };

  if (!tree) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.sidebar}>
        <TreeSidebar treeName={tree.name} persons={persons} />
      </div>
      <div className={styles.main}>
        <TreeMainView
          persons={persons}
          relationships={relationships}
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
          onSubmit={handleCreateRelationship}
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
