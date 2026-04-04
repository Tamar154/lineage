import { useState } from "react";
import { register } from "../services/authService";
import { useNavigate } from "react-router-dom";
import styles from "../styles/RegisterPage.module.css";

const RegisterPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      await register({ name, email, password });
      navigate("/trees");
    } catch (error: any) {
      setError(error.response.data.message || "Something went wrong");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2>Register</h2>
      <label htmlFor="name">Name</label>
      <input
        className={styles.inputField}
        type="text"
        id="name"
        value={name}
        placeholder="Name"
        required={true}
        onChange={(e) => setName(e.target.value)}
      />

      <label htmlFor="email">Email</label>
      <input
        className={styles.inputField}
        type="email"
        id="email"
        value={email}
        placeholder="Email"
        autoComplete="email"
        required={true}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label htmlFor="password">Password</label>
      <input
        className={styles.inputField}
        type="password"
        id="password"
        value={password}
        placeholder="Password"
        autoComplete="password"
        required={true}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className={styles.errorMsg}>{error}</p>}

      <button className={styles.submitBtn} type="submit">
        Register
      </button>

      <p>Already have an accout? </p>
      <button
        className={styles.loginBtn}
        type="button"
        onClick={() => navigate("/login")}
      >
        Login
      </button>
    </form>
  );
};

export default RegisterPage;
