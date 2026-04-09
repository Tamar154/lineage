import { useState } from "react";
import PersonDetailsPanel from "../components/PersonDetailsPanel";
import TreeMainView from "../components/TreeMainView";
import TreeSidebar from "../components/TreeSidebar";
import styles from "../styles/TreePage.module.css";

const TreePage = () => {
  const [viewMode, setViewMode] = useState<"list" | "graph">("graph");

  return (
    <div className={styles.wrapper}>
      <div className={styles.sidebar}>
        <TreeSidebar viewMode={viewMode} setViewMode={setViewMode} />
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
