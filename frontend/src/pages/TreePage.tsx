import PersonDetailsPanel from "../components/PersonDetailsPanel";
import TreeMainView from "../components/TreeMainView";
import TreeSidebar from "../components/TreeSidebar";
import styles from "../styles/TreePage.module.css";

const TreePage = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.sidebar}>
        <TreeSidebar />
      </div>
      <div className={styles.main}>
        <TreeMainView />
      </div>
      <div className={styles.details}>
        <PersonDetailsPanel />
      </div>
    </div>
  );
};

export default TreePage;

// import { useParams } from "react-router-dom";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { getTreeById, type Tree } from "../services/treeService";
// import styles from "../styles/TreePage.module.css";

// const TreePage = () => {
//   const { treeId } = useParams();
//   const navigate = useNavigate();

//   const [tree, setTree] = useState<Tree | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   console.log("tree: ", tree);

//   useEffect(() => {
//     if (!treeId) {
//       setLoading(false);
//       return;
//     }

//     const getTree = async () => {
//       try {
//         const res = await getTreeById({ treeId });
//         setTree(res.data);
//       } catch (error: any) {
//         if (error.response?.status === 401) {
//           navigate("/login");
//           return;
//         }
//         setError(error.response.data.message || "Something went wrong");
//       } finally {
//         setLoading(false);
//       }
//     };

//     getTree();
//   }, [treeId, navigate]);

//   if (!treeId) return <p>Invalid tree id</p>;
//   if (loading) return <p>Loading...</p>;
//   if (error) return <p>{error}</p>;
//   if (!tree) return <p>Tree Not Found</p>;

//   return (
//     <div className={styles.wrapper}>
//       <h1>{tree.name}</h1>

//       <div className={styles.info}>
//         <h3>Tree Info</h3>
//         <p>ID: {tree.id}</p>
//         <p>Created: {new Date(tree.createdAt).toLocaleDateString()}</p>
//         <p>Updated: {new Date(tree.updatedAt).toLocaleDateString()}</p>
//       </div>

//       <div className={styles.people}>
//         <h3>People</h3>
//         <p>To be implemented</p>
//       </div>

//       <div className={styles.rels}>
//         <h3>Relationships</h3>
//         <p>To be implemented</p>
//       </div>
//     </div>
//   );
// };

// export default TreePage;
