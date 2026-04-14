import type { Person } from "../services/personService";
import styles from "../styles/PersonDetailsPanel.module.css";

type Props = {
  person: Person;
  onClosePanel: () => void;
  onEditPerson: () => void;
};

const PersonDetailsPanel = ({ person, onClosePanel, onEditPerson }: Props) => {
  const formatDate = (date?: string) => {
    if (!date) return "Unknown";

    return new Date(date).toLocaleDateString();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>Person Details</h3>
        <button
          className={styles.closeBtn}
          type="button"
          onClick={onClosePanel}
        >
          x
        </button>
      </div>

      <div className={styles.mainInfo}>
        <h2 className={styles.name}>
          {person.firstName} {person.lastName}
        </h2>
        <p className={styles.dates}>
          {formatDate(person.birthDate)} - {formatDate(person.deathDate)}
        </p>
      </div>

      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Biography</h4>
        <p className={styles.bio}>{person.bio || "No biography yet."}</p>
      </div>

      <div className={styles.actions}>
        <button className={styles.secondaryBtn} onClick={onEditPerson}>
          Edit Details
        </button>
        <button className={styles.secondaryBtn}>Add Relationship</button>
        <button className={styles.primaryBtn}>View Full Profile</button>
        <button className={styles.dangerBtn}>Remove Person</button>
      </div>
    </div>
  );
};

export default PersonDetailsPanel;
