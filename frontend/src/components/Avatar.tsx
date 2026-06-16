import styles from "../styles/Avatar.module.css";

type Props = {
  name: string;
  size?: number;
};

const COLORS: [string, string][] = [
  ["#DBEAFE", "#1E40AF"],
  ["#D1FAE5", "#065F46"],
  ["#FEF3C7", "#92400E"],
  ["#FCE7F3", "#9D174D"],
  ["#EDE9FE", "#4C1D95"],
  ["#FFEDD5", "#9A3412"],
];

const generateColor = (id: string): [string, string] => {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) % 1000;
  return COLORS[Math.abs(hash) % COLORS.length];
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const firstInitial = parts[0]?.[0] ?? "?";
  const secondInitial = parts[1]?.[0] ?? "";

  return `${firstInitial}${secondInitial}`.toUpperCase();
};

const Avatar = ({ name, size = 40 }: Props) => {
  const [background, text] = generateColor(name);
  return (
    <div
      className={styles.avatar}
      style={{
        backgroundColor: background,
        color: text,
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
