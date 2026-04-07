import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getTrees, type Tree } from "../services/treeService";
import CreateTreeForm from "../components/CreateTreeForm";
import styles from "../styles/TreesPage.module.css";
import TreesLayout from "../components/TreesLayout";

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
          Create New Tree
        </button>

        {showTreeForm && (
          <CreateTreeForm setShow={setShowTreeForm} refreshTrees={fetchTrees} />
        )}

        <div className={styles.treesWrapper}>
          {trees.map((tree) => (
            <div
              className={styles.treeItem}
              key={tree.id}
              onClick={() => navigate(`/trees/${tree.id}`)}
            >
              {tree.name}
            </div>
          ))}
        </div>

        {error && <p>{error}</p>}
      </div>
    </TreesLayout>
  );
};

export default TreesPage;
