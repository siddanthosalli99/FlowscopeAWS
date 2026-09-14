"use client";

import { Star } from "lucide-react";
import { TimeFilter } from "@/types/session";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  sessionCount: number;
  guideCount: number;
  commandCount: number;
  timeFilter: TimeFilter;
  onTimeFilterChange: (f: TimeFilter) => void;
  tags: string[];
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (v: boolean) => void;
}

const TIME_OPTIONS: { key: TimeFilter; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "older", label: "Older" },
];

export default function Sidebar({
  sessionCount,
  guideCount,
  commandCount,
  timeFilter,
  onTimeFilterChange,
  tags,
  favoritesOnly,
  onFavoritesOnlyChange,
}: SidebarProps) {
  return (
    <nav className={styles.sidebar} aria-label="Session filters">
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Library</div>
        <div className={styles.libraryRow}>
          <span className={styles.libraryCount}>{sessionCount}</span> sessions
        </div>
        <div className={styles.libraryRow}>
          <span className={styles.libraryCount}>{guideCount}</span> guides
        </div>
        <div className={styles.libraryRow}>
          <span className={styles.libraryCount}>{commandCount}</span> commands
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>When</div>
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`${styles.filterButton} fs-raised ${
              timeFilter === opt.key ? styles.filterButtonActive : ""
            }`}
            aria-pressed={timeFilter === opt.key}
            onClick={() => onTimeFilterChange(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Tags</div>
        {tags.length === 0 ? (
          <div className={styles.tagsEmpty}>No tags yet</div>
        ) : (
          <div className={styles.tagsWrap}>
            {tags.map((tag) => (
              <span key={tag} className={styles.tagChip}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className={`${styles.favButton} fs-raised ${
          favoritesOnly ? styles.favButtonActive : ""
        }`}
        aria-pressed={favoritesOnly}
        onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
      >
        <Star
          size={14}
          className={styles.favIcon}
          fill={favoritesOnly ? "currentColor" : "none"}
        />
        Favorites only
      </button>
    </nav>
  );
}
