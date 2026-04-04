import { useEffect, useState } from "react";
import TreeItem from "../components/TreeItem";
import { getTrees } from "../services/treeService";
import CreateTreeForm from "../components/CreateTreeForm";
import { useNavigate } from "react-router-dom";

const TreesPage = () => {
  const [trees, setTrees] = useState([]);
  const navigate = useNavigate();

  const [showTreeForm, setShowTreeForm] = useState(false);

  useEffect(() => {
    const fetchTrees = async () => {
      try {
        const res = await getTrees();
        setTrees(res.data);
      } catch (error: any) {
        navigate("/login");
        return;
      }
    };

    fetchTrees();
  }, []);
  return (
    <div>
      <button onClick={() => setShowTreeForm(!showTreeForm)}>
        Create New Tree
      </button>

      {showTreeForm && <CreateTreeForm />}
      {/* <TreeItem /> */}
    </div>
  );
};

export default TreesPage;
