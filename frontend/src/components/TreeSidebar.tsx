import { useNavigate } from "react-router-dom";
import { useState } from "react";
import AppLogo from "./AppLogo";
import { IoIosArrowBack } from "react-icons/io";
import type { Person } from "../services/personService";
import styles from "../styles/TreeSidebar.module.css";

type Props = {
  treeName: string;
  persons: Person[];
};

const TreeSidebar = ({ treeName, persons }: Props) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPersons = persons.filter((person) => {
    const fullName = `${person.firstName} ${person.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <div className={styles.wrapper}>
      {/* <div className={styles.topSection}> */}
      <button className={styles.backBtn} onClick={() => navigate("/trees")}>
        <IoIosArrowBack />
        <span>Back to Trees</span>
      </button>
      {/* </div> */}

      <div className={styles.header}>
        <AppLogo variant="sm" />
        <span>{treeName}</span>
      </div>

      <div className={styles.searchSection}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search person"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles.personList}>
        {filteredPersons.map((person) => (
          <div className={styles.personItem} key={person.id}>
            {person.firstName} {person.lastName}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TreeSidebar;
