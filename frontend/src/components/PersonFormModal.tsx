import { useState } from "react";
import type { PersonFormData } from "../types/PersonFormData";
import styles from "../styles/PersonFormModal.module.css";

type Props = {
  mode: "create" | "edit";
  initialData?: PersonFormData;
  onClose: () => void;
  onSubmit: (data: PersonFormData) => Promise<void>;
};

const emptyForm: PersonFormData = {
  firstName: "",
  lastName: "",
  birthDate: "",
  deathDate: "",
  bio: "",
};

const PersonFormModal = ({ mode, initialData, onClose, onSubmit }: Props) => {
  const [formData, setFormData] = useState<PersonFormData>({
    ...emptyForm,
    ...initialData,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);

      await onSubmit({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        birthDate: formData.birthDate || undefined,
        deathDate: formData.deathDate || undefined,
        bio: formData.bio?.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = mode === "create" ? "Add Person" : "Edit Person";
  const submitLabel = mode === "create" ? "Create" : "Save Changes";
  const submittingLabel = mode === "create" ? "Creating..." : "Saving...";

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>{title}</h2>
        <div className={styles.formGroup}>
          <label htmlFor="firstName">First Name</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="lastName">Last Name</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="birthDate">Birth Date</label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="deathDate">Death Date</label>
          <input
            id="deathDate"
            name="deathDate"
            type="date"
            value={formData.deathDate}
            onChange={handleChange}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="bio">Biography</label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={formData.bio}
            onChange={handleChange}
          />
        </div>

        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className={styles.createBtn}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? submittingLabel : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonFormModal;
