import { GiFamilyTree } from "react-icons/gi";
import { RiDeleteBin5Line } from "react-icons/ri";
import { SlPeople } from "react-icons/sl";
import { CiCalendar } from "react-icons/ci";

import styles from "../styles/TreeCard.module.css";

type Props = {
  name: string;
  date: string;
  onClick: () => void;
  onDelete: () => void;
};

const TreeCard = ({ name, date, onClick, onDelete }: Props) => {
  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <GiFamilyTree className={styles.treeIcon} />
        </div>

        <h3 className={styles.title}>{name}</h3>
      </div>

      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <SlPeople />
          <span>TBI</span>
        </span>

        <span className={styles.metaItem}>
          <CiCalendar />
          <span>{new Date(date).toLocaleDateString()}</span>
        </span>
      </div>

      <div className={styles.footer}>
        <button className={styles.deleteBtn} onClick={handleDelete}>
          <RiDeleteBin5Line />
        </button>
      </div>
    </div>
  );
};

export default TreeCard;
