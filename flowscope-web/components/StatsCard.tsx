import styles from "./StatsCard.module.css";

interface StatsCardProps {
  value: string;
  label: string;
}

export default function StatsCard({ value, label }: StatsCardProps) {
  return (
    <div className={`${styles.card} fs-raised`}>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
