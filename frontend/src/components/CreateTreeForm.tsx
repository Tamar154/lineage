import { useState } from "react";
import { createTree } from "../services/treeService";
import styles from "../styles/CreateTreeForm.module.css";

type props = {
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  refreshTrees: () => Promise<void>;
};

const CreateTreeForm = ({ setShow, refreshTrees }: props) => {
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await createTree({ name });
      setShow(false);
      await refreshTrees();
    } catch (error: any) {
      console.error(error.response.data.message || "Something went wrong");
    }
  };

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label htmlFor="name"></label>
        <input
          className={styles.input}
          type="text"
          id="name"
          value={name}
          placeholder="Tree name"
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
        />

        <button className={styles.createBtn} type="submit">
          Create Tree
        </button>
      </form>
    </div>
  );
};

export default CreateTreeForm;
