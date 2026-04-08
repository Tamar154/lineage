import { useState } from "react";
import { createTree } from "../services/treeService";
import styles from "../styles/CreateTreeForm.module.css";

type Props = {
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  refreshTrees: () => Promise<void>;
};

const CreateTreeForm = ({ setShow, refreshTrees }: Props) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Tree name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      await createTree({ name: trimmedName });
      await refreshTrees();
      setShow(false);
    } catch (error: any) {
      setError(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={() => setShow(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.header}>
            <h2 className={styles.title}>Create a new tree</h2>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              Tree name
            </label>

            <input
              className={styles.input}
              type="text"
              id="name"
              value={name}
              placeholder="Tree name goes here"
              autoComplete="off"
              onChange={(e) => setName(e.target.value)}
            />

            {error && <p className={styles.error}>{error}</p>}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setShow(false)}
            >
              Cancel
            </button>

            <button
              className={styles.createBtn}
              type="submit"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? "Creating..." : "Create Tree"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTreeForm;
