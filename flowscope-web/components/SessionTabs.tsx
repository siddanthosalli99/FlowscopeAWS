"use client";

import { TabKey } from "@/types/session";
import styles from "./SessionTabs.module.css";

interface SessionTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "transcript", label: "Transcript" },
  { key: "guide", label: "Guide" },
  { key: "sessionJson", label: "Session JSON" },
  { key: "blocksJson", label: "Blocks JSON" },
];

export default function SessionTabs({
  activeTab,
  onTabChange,
}: SessionTabsProps) {
  return (
    <div className={styles.tabList} role="tablist" aria-label="Session detail tabs">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.key}
          className={`${styles.tab} ${
            activeTab === tab.key ? styles.tabActive : ""
          }`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
