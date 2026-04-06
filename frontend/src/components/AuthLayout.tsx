import { LuTrees } from "react-icons/lu";
import styles from "../styles/AuthLayout.module.css";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <div className={styles.header}>
        <LuTrees className={styles.icon} />
        <h1>LineAge</h1>
        <p>Build and explore your family lineage</p>
      </div>

      <div>{children}</div>
    </div>
  );
};

export default AuthLayout;
