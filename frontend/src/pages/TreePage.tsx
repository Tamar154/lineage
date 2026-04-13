import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getTreeById, type Tree } from "../services/treeService";
import PersonDetailsPanel from "../components/PersonDetailsPanel";
import TreeMainView from "../components/TreeMainView";
import TreeSidebar from "../components/TreeSidebar";
import styles from "../styles/TreePage.module.css";
import { getAllPersons, type Person } from "../services/personService";

const TreePage = () => {
  const { treeId } = useParams();
  const [tree, setTree] = useState<Tree | null>(null);
  const [persons, setPersons] = useState<Person[]>([]);

  const [viewMode, setViewMode] = useState<"list" | "graph">("graph");

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
      } catch (error) {}
    };

    fetchTree();
    fetchPersons();
  }, [treeId]);

  if (!tree) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.sidebar}>
        <TreeSidebar
          viewMode={viewMode}
          setViewMode={setViewMode}
          treeName={tree.name}
          persons={persons}
        />
      </div>
      <div className={styles.main}>
        <TreeMainView treeId={treeId!} />
      </div>
      <div className={styles.details}>
        <PersonDetailsPanel />
      </div>
    </div>
  );
};

export default TreePage;
