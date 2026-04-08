import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { deleteTree, getTrees, type Tree } from "../services/treeService";
import CreateTreeForm from "../components/CreateTreeForm";
import TreesLayout from "../components/TreesLayout";

import styles from "../styles/TreesPage.module.css";
import { FaPlus } from "react-icons/fa6";
import TreeCard from "../components/TreeCard";

const TreesPage = () => {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [showTreeForm, setShowTreeForm] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchTrees = async () => {
    try {
      const res = await getTrees();
      setTrees(res.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }
      setError(error.response.data.message || "Something went wrong");
    }
  };

  const handleDeleteTree = async (treeId: string) => {
    try {
      await deleteTree({ treeId });
      setTrees((prevTrees) => prevTrees.filter((tree) => tree.id !== treeId));
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to delete tree");
    }
  };

  useEffect(() => {
    fetchTrees();
  }, []);

  return (
    <TreesLayout>
      <div className={styles.wrapper}>
        <button
          className={styles.createTreeBtn}
          onClick={() => setShowTreeForm(!showTreeForm)}
        >
          <FaPlus />
          <span>Create Tree</span>
        </button>

        {showTreeForm && (
          <CreateTreeForm setShow={setShowTreeForm} refreshTrees={fetchTrees} />
        )}

        <div className={styles.treesWrapper}>
          {trees.map((tree) => (
            <TreeCard
              key={tree.id}
              name={tree.name}
              date={tree.createdAt}
              onClick={() => navigate(`/trees/${tree.id}`)}
              onDelete={() => handleDeleteTree(tree.id)}
            />
          ))}
        </div>

        {error && <p>{error}</p>}
      </div>
    </TreesLayout>
  );
};

export default TreesPage;
