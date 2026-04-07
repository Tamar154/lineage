import { LuTrees } from "react-icons/lu";
import styles from "../styles/AppLogo.module.css";

type Props = {
  variant?: "sm" | "lg";
};

const AppLogo = ({ variant = "sm" }: Props) => {
  return (
    <div className={styles.wrapper}>
      <LuTrees className={`${styles.icon} ${styles[variant]}`} />
    </div>
  );
};

export default AppLogo;
