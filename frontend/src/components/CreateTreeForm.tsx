import { useState } from "react";
import { createTree } from "../services/treeService";
import styles from "../styles/CreateTreeForm.module.css";

const CreateTreeForm = () => {
  const [name, setName] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await createTree({ name });
      console.log("createTreeForm res: ", res);
    } catch (error: any) {
      console.error(error.response.data.message || "Something went wrong");
    }
  };

  return (
    <div className={styles.createTreeForm}>
      <form onSubmit={handleSubmit}>
        <label htmlFor="name"></label>
        <input
          type="text"
          id="name"
          placeholder="Tree name"
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
        />

        <button type="submit"></button>
      </form>
    </div>
  );
};

export default CreateTreeForm;
