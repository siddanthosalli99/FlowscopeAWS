"use client";

import { RefreshCw, Search } from "lucide-react";
import { SortOrder } from "@/types/session";
import styles from "./TopBar.module.css";

interface TopBarProps {
  folderPath: string;
  onChooseFolder: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
}

export default function TopBar({
  folderPath,
  onChooseFolder,
  onRefresh,
  isRefreshing,
  query,
  onQueryChange,
  sortOrder,
  onSortOrderChange,
}: TopBarProps) {
  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <span className={styles.heart} aria-hidden="true">
          ♥
        </span>
        <span>FlowScope</span>
        <span className={styles.heart} aria-hidden="true">
          ♥
        </span>
      </div>

      <div className={`${styles.pathField} fs-raised`} title={folderPath}>
        {folderPath}
      </div>

      <button
        type="button"
        className={`${styles.button} fs-raised`}
        onClick={onChooseFolder}
      >
        Choose Folder...
      </button>

      <button
        type="button"
        className={`${styles.iconButton} fs-raised`}
        onClick={onRefresh}
        aria-label="Refresh sessions"
        data-spinning={isRefreshing}
      >
        <RefreshCw size={16} />
      </button>

      <div className={`${styles.searchWrap} fs-raised`}>
        <Search size={15} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search sessions, tags, commands..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Search sessions, tags, commands"
        />
      </div>

      <select
        className={styles.sortSelect}
        value={sortOrder}
        onChange={(e) => onSortOrderChange(e.target.value as SortOrder)}
        aria-label="Sort sessions"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>
    </header>
  );
}
