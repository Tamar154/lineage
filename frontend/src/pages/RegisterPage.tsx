import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService";
import AuthLayout from "../components/AuthLayout";
import styles from "../styles/LoginRegister.module.css";

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
    <AuthLayout>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>Create account</h2>
        <label htmlFor="name">Full Name</label>
        <input
          className={styles.inputField}
          type="text"
          id="name"
          value={name}
          placeholder="Full Name"
          required={true}
          onChange={(e) => setName(e.target.value)}
        />

        <label htmlFor="email">Email</label>
        <input
          className={styles.inputField}
          type="email"
          id="email"
          value={email}
          placeholder="you@example.com"
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
          placeholder="At least 6 characters"
          autoComplete="password"
          required={true}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className={styles.errorMsg}>{error}</p>}

        <button className={styles.submitBtn} type="submit">
          Create account
        </button>

        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
