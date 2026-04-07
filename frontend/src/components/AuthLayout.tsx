import styles from "../styles/AuthLayout.module.css";
import AppLogo from "./AppLogo";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <div className={styles.wrapper}>
        <AppLogo variant="lg" />
        <h1>LineAge</h1>
        <p>Build and explore your family lineage</p>
      </div>

      <div>{children}</div>
    </div>
  );
};

export default AuthLayout;
