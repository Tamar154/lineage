import type { Person } from "../services/personService";

type Props = {
  person: Person;
  onClosePanel: () => void;
};

const PersonDetailsPanel = ({ person, onClosePanel }: Props) => {
  return (
    <div>
      <div>
        <h3>Person Details</h3>
        <button onClick={onClosePanel}>x</button>
      </div>

      <p>
        {person.firstName} {person.lastName}
      </p>

      <p>
        {person.birthDate || "Unknown"} - {person.deathDate || "Unknown"}
      </p>

      <div>
        Biography
        <p>{person.bio || "No Bio."}</p>
      </div>

      <div>
        <button>Edit Details</button>
        <button>Add Relationship - TBI</button>
        <button>View Full Profile</button>
      </div>
    </div>
  );
};

export default PersonDetailsPanel;
