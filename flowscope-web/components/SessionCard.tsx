"use client";

import { Star } from "lucide-react";
import { Session } from "@/types/session";
import styles from "./SessionCard.module.css";

interface SessionCardProps {
  session: Session;
  selected: boolean;
  onSelect: () => void;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function SessionCard({
  session,
  selected,
  onSelect,
}: SessionCardProps) {
  return (
    <li
      className={`${styles.card} fs-raised ${selected ? styles.selected : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className={styles.topRow}>
        <span className={styles.title}>{session.title}</span>
        {session.favorite && (
          <Star
            size={14}
            className={styles.favStar}
            fill="currentColor"
            aria-label="Favorite"
          />
        )}
      </div>

      <div className={styles.metaRow}>
        <span
          className={`${styles.badge} ${
            session.guide ? styles.badgeGuide : ""
          }`}
        >
          {session.guide ? "Guide ready" : "No guide"}
        </span>
        <span className={styles.metaText}>
          {session.commands.length} cmd
          {session.commands.length === 1 ? "" : "s"}
        </span>
        <span className={styles.metaText}>
          {formatDuration(session.duration)}
        </span>
      </div>

      {session.tags.length > 0 && (
        <div className={styles.tagRow}>
          {session.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}
