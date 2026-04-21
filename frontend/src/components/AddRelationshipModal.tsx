import { useState } from "react";
import type { Person } from "../services/personService";
import styles from "../styles/AddRelationshipModal.module.css";

type Props = {
  sourcePerson: Person;
  persons: Person[];
  onClose: () => void;
  onSubmit: (data: {
    type: "parent" | "child" | "spouse";
    targetPersonId: string;
  }) => void;
};

const AddRelationshipModal = ({
  sourcePerson,
  persons,
  onClose,
  onSubmit,
}: Props) => {
  const [type, setType] = useState<"parent" | "child" | "spouse">("parent");
  const [targetPersonId, setTargetPersonId] = useState("");

  const availablePersons = persons.filter(
    (person) => person.id !== sourcePerson.id,
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!targetPersonId) return;

    onSubmit({
      type,
      targetPersonId,
    });

    onClose();
  };

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Add Relationship</h2>

        <p className={styles.text}>
          {sourcePerson.firstName} {sourcePerson.lastName}
        </p>

        <div className={styles.formGroup}>
          <label className={styles.label}>Relationship Type</label>
          <select
            className={styles.select}
            value={type}
            onChange={(e) =>
              setType(e.target.value as "parent" | "child" | "spouse")
            }
          >
            <option value="parent">Parent</option>
            <option value="child">Child</option>
            <option value="spouse">Spouse</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Target Person</label>
          <select
            className={styles.select}
            value={targetPersonId}
            onChange={(e) => setTargetPersonId(e.target.value)}
            required
          >
            <option value="">Select a person</option>

            {availablePersons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.firstName} {person.lastName}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>

          <button className={styles.submitBtn} type="submit">
            Add
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRelationshipModal;
