import { useNavigate } from "react-router-dom";
import AppLogo from "./AppLogo";
import { IoIosArrowBack } from "react-icons/io";
import type { Person } from "../services/personService";
import styles from "../styles/TreeSidebar.module.css";
import SearchPerson from "./SearchPerson";

type Props = {
  treeName: string;
  persons: Person[];
};

const TreeSidebar = ({ treeName, persons }: Props) => {
  const navigate = useNavigate();

  return (
    <div className={styles.wrapper}>
      <button className={styles.backBtn} onClick={() => navigate("/trees")}>
        <IoIosArrowBack />
        <span>Back to Trees</span>
      </button>

      <div className={styles.header}>
        <AppLogo variant="sm" />
        <span>{treeName}</span>
      </div>

      <SearchPerson persons={persons} />
    </div>
  );
};

export default TreeSidebar;
