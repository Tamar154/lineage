import type React from "react";
import AppLogo from "./AppLogo";
import { MdOutlineLogout } from "react-icons/md";
import styles from "../styles/TreesLayout.module.css";

type Props = {
  children: React.ReactNode;
};

const TreesLayout = (props: Props) => {
  const handleLogout = async () => {};

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.logoGroup}>
          <AppLogo />
          <h2>LineAge</h2>
        </div>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <MdOutlineLogout />
          Logout
        </button>
      </div>

      <div className={styles.intro}>
        <h2>Your Family Trees</h2>
        <p>Manage and explore your family lineages</p>
      </div>

      <div className={styles.content}>{props.children}</div>
    </div>
  );
};

export default TreesLayout;
