import { useState } from "react";
import { login } from "../services/authService";
import { useNavigate } from "react-router-dom";
import styles from "../styles/LoginPage.module.css";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      await login({ email, password });
      navigate("/trees");
    } catch (error: any) {
      setError(error.response.data.message || "Something went wrong");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2>Login</h2>
      <label htmlFor="email">Email</label>
      <input
        className={styles.inputField}
        type="email"
        id="email"
        value={email}
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
        autoComplete="current-password"
        required={true}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p className={styles.errorMsg}>{error}</p>}

      <button className={styles.submitBtn} type="submit">
        Login
      </button>

      <p>Don't have an accout? </p>
      <button
        className={styles.registerBtn}
        type="button"
        onClick={() => navigate("/register")}
      >
        Register
      </button>
    </form>
  );
};

export default LoginPage;
