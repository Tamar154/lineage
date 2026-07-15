import { useState } from "react";
import type { Person } from "../services/personService";
import SearchPerson from "./SearchPerson";

import styles from "../styles/AddRelationshipModal.module.css";
import type { IconType } from "react-icons";
import { TbArrowUpCircle } from "react-icons/tb";
import { TbArrowDownCircle } from "react-icons/tb";
import { FaRegHeart } from "react-icons/fa";

type Props = {
  sourcePerson: Person;
  persons: Person[];
  onClose: () => void;
  onSubmit: (data: { type: RelType; targetPersonIds: string[] }) => void;
};

type RelType = "child" | "parent" | "spouse";

const REL_OPTIONS: {
  value: RelType;
  label: string;
  description: string;
  icon: IconType;
}[] = [
  {
    value: "child",
    label: "Child of",
    description: "Add a parent to this person",
    icon: TbArrowUpCircle,
  },
  {
    value: "parent",
    label: "Parent of",
    description: "Add a child to this person",
    icon: TbArrowDownCircle,
  },
  {
    value: "spouse",
    label: "Spouse of",
    description: "Add a spouse to this person",
    icon: FaRegHeart,
  },
];

const MAX_TARGETS: Record<RelType, number | null> = {
  child: 2,
  parent: null, // unlimited
  spouse: 1,
};

const AddRelationshipModal = ({
  sourcePerson,
  persons,
  onClose,
  onSubmit,
}: Props) => {
  const [targetPersonIds, setTargetPersonIds] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<RelType>("parent");

  const availablePersons = persons.filter(
    (person) => person.id !== sourcePerson.id,
  );

  const handleSubmit = () => {
    if (targetPersonIds.length === 0) return;

    onSubmit({
      type: selectedType,
      targetPersonIds,
    });

    onClose();
  };

  const handleSelect = (person: Person) => {
    setTargetPersonIds((prev) => {
      const alreadySelected = prev.includes(person.id);

      if (alreadySelected) {
        return prev.filter((id) => id !== person.id);
      }

      const max = MAX_TARGETS[selectedType];

      if (max !== null && prev.length >= max) {
        return prev;
      }

      return [...prev, person.id];
    });
  };

  const fullName = [sourcePerson.firstName, sourcePerson.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.wrapper}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <p>Add relationship for {fullName}</p>
          <small>{fullName} is a...</small>
        </div>

        <div className={styles.relType}>
          {REL_OPTIONS.map((opt) => {
            const Icon = opt.icon;

            return (
              <button
                className={`${styles.typeButton} ${selectedType === opt.value ? styles.typeButtonSelected : ""}`}
                key={opt.value}
                type="button"
                onClick={() => {
                  setSelectedType(opt.value);
                  setTargetPersonIds([]);
                }}
              >
                <Icon className={styles.icon} />
                <span>
                  <p>{opt.label}</p>
                  <small>{opt.description}</small>
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.search}>
          <SearchPerson
            persons={availablePersons}
            selectedPersonIds={targetPersonIds}
            onSelect={handleSelect}
          />
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>

          <button
            className={styles.confirmBtn}
            disabled={targetPersonIds.length === 0}
            onClick={handleSubmit}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRelationshipModal;
