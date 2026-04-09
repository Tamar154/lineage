import AppLogo from "./AppLogo";
import { IoIosArrowBack } from "react-icons/io";

import styles from "../styles/TreeSidebar.module.css";

type Props = {
  viewMode: "list" | "graph";
  setViewMode: React.Dispatch<React.SetStateAction<"list" | "graph">>;
};

const TreeSidebar = ({ viewMode, setViewMode }: Props) => {
  return (
    <div className={styles.wrapper}>
      {/* <div className={styles.topSection}> */}
      <button className={styles.backBtn}>
        <IoIosArrowBack />
        <span>Back to Trees</span>
      </button>
      {/* </div> */}

      <div className={styles.header}>
        <AppLogo variant="sm" />
        <span>TreeName - TBI</span>
      </div>

      <div className={styles.viewToggle}>
        <button
          className={`${styles.toggleButton} ${viewMode === "list" ? styles.active : ""}`}
          onClick={() => setViewMode("list")}
        >
          List
        </button>
        <button
          className={`${styles.toggleButton} ${viewMode === "graph" ? styles.active : ""}`}
          onClick={() => setViewMode("graph")}
        >
          Graph
        </button>
      </div>

      <div className={styles.searchSection}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search person"
        />
      </div>

      <div className={styles.personList}>
        <div className={styles.personItem}>Temp Temp</div>
        <div className={styles.personItem}>Temp Temp</div>
        <div className={styles.personItem}>Temp Temp</div>
        <div className={styles.personItem}>Temp Temp</div>
      </div>
    </div>
  );
};

export default TreeSidebar;
