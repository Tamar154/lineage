import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, loginWithGoogle } from "../services/authService";
import AuthLayout from "../components/AuthLayout";
import styles from "../styles/LoginRegister.module.css";

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
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");

    try {
      await loginWithGoogle();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <AuthLayout>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2>Welcome back</h2>
        <label htmlFor="email">Email</label>
        <input
          className={styles.inputField}
          type="email"
          id="email"
          value={email}
          autoComplete="email"
          placeholder="you@example.com"
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
          placeholder="At least 8 characters"
          required={true}
          minLength={8}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className={styles.errorMsg}>{error}</p>}

        <button className={styles.submitBtn} type="submit">
          Sign in
        </button>

        <button
          className={styles.googleBtn}
          type="button"
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </button>

        <p>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
