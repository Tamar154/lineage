import AppLogo from "./AppLogo";
import { IoIosArrowBack } from "react-icons/io";

import styles from "../styles/TreeSidebar.module.css";
import type { Person } from "../services/personService";

type Props = {
  viewMode: "list" | "graph";
  setViewMode: React.Dispatch<React.SetStateAction<"list" | "graph">>;
  treeName: string;
  persons: Person[];
};

const TreeSidebar = ({ viewMode, setViewMode, treeName, persons }: Props) => {
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
        <span>{treeName}</span>
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
        {persons.map((person) => (
          <div className={styles.personItem} key={person.id}>
            {person.firstName} {person.lastName}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TreeSidebar;
