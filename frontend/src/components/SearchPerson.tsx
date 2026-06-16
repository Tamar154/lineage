import { useState } from "react";
import type { Person } from "../services/personService";
import styles from "../styles/SearchPerson.module.css";
import Avatar from "./Avatar";
import { getPersonDisplayName } from "../utils/personName";

type Props = {
  persons: Person[];
  selectedPersonIds?: string[];
  onSelect?: (person: Person) => void;
};

const SearchPerson = ({ persons, selectedPersonIds, onSelect }: Props) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPersons = persons.filter((person) => {
    const fullName = getPersonDisplayName(person).toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.searchSection}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search person"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className={styles.personList}>
        {filteredPersons.length === 0 && <p>No people match your search.</p>}
        {filteredPersons.map((person) => {
          const isSelected = selectedPersonIds?.includes(person.id);
          const displayName = getPersonDisplayName(person);

          return (
            <div
              className={`${styles.personItem} ${isSelected ? styles.personItemSelected : ""}`}
              key={person.id}
              onClick={() => onSelect?.(person)}
            >
              <Avatar name={displayName} />
              {displayName}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchPerson;
