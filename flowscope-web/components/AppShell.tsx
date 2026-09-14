"use client";

import { useMemo, useState } from "react";
import { Session, TabKey, TimeFilter, SortOrder } from "@/types/session";
import { MOCK_NOW } from "@/data/mockSessions";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import SessionList from "./SessionList";
import SessionDetails from "./SessionDetails";
import styles from "./AppShell.module.css";

interface AppShellProps {
  initialSessions: Session[];
  folderPath: string;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === MOCK_NOW.getFullYear() &&
    d.getMonth() === MOCK_NOW.getMonth() &&
    d.getDate() === MOCK_NOW.getDate()
  );
}

function isThisWeek(iso: string): boolean {
  const d = new Date(iso);
  const diffMs = MOCK_NOW.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

export default function AppShell({ initialSessions, folderPath }: AppShellProps) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSessions[0]?.id ?? null
  );
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const [query, setQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [path, setPath] = useState(folderPath);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    sessions.forEach((s) => s.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();

    let result = sessions.filter((s) => {
      if (favoritesOnly && !s.favorite) return false;

      if (timeFilter === "today" && !isToday(s.createdAt)) return false;
      if (timeFilter === "week" && !isThisWeek(s.createdAt)) return false;
      if (timeFilter === "older" && isThisWeek(s.createdAt)) return false;

      if (q.length > 0) {
        const haystack = [
          s.title,
          ...s.tags,
          ...s.commands,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    result = result.slice().sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });

    return result;
  }, [sessions, query, timeFilter, sortOrder, favoritesOnly]);

  const selectedSession =
    sessions.find((s) => s.id === selectedId) ?? null;

  function handleSelectSession(id: string) {
    setSelectedId(id);
    setActiveTab("overview");
  }

  function updateSession(id: string, patch: Partial<Session>) {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }

  function handleToggleFavorite(id: string) {
    const target = sessions.find((s) => s.id === id);
    if (!target) return;
    updateSession(id, { favorite: !target.favorite });
  }

  function handleAddTag(id: string, tag: string) {
    const target = sessions.find((s) => s.id === id);
    if (!target) return;
    const trimmed = tag.trim();
    if (!trimmed || target.tags.includes(trimmed)) return;
    updateSession(id, { tags: [...target.tags, trimmed] });
  }

  function handleRemoveTag(id: string, tag: string) {
    const target = sessions.find((s) => s.id === id);
    if (!target) return;
    updateSession(id, { tags: target.tags.filter((t) => t !== tag) });
  }

  function handleNotesChange(id: string, notes: string) {
    updateSession(id, { notes });
  }

  function handleDeleteSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  }

  function handleChooseFolder() {
    const next = window.prompt("Enter a FlowScope data directory path", path);
    if (next && next.trim().length > 0) {
      setPath(next.trim());
    }
  }

  function handleRefresh() {
    setIsRefreshing(true);
    window.setTimeout(() => setIsRefreshing(false), 500);
  }

  return (
    <div className={styles.shell}>
      <TopBar
        folderPath={path}
        onChooseFolder={handleChooseFolder}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        query={query}
        onQueryChange={setQuery}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
      />
      <div className={styles.body}>
        <div className={styles.sidebarCol}>
          <Sidebar
            sessionCount={sessions.length}
            guideCount={sessions.filter((s) => s.guide !== null).length}
            commandCount={sessions.reduce((n, s) => n + s.commands.length, 0)}
            timeFilter={timeFilter}
            onTimeFilterChange={setTimeFilter}
            tags={allTags}
            favoritesOnly={favoritesOnly}
            onFavoritesOnlyChange={setFavoritesOnly}
          />
        </div>
        <div className={styles.listCol}>
          <SessionList
            sessions={filteredSessions}
            selectedId={selectedId}
            onSelect={handleSelectSession}
          />
        </div>
        <div className={styles.mainCol}>
          <SessionDetails
            session={selectedSession}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onToggleFavorite={handleToggleFavorite}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onNotesChange={handleNotesChange}
            onDeleteSession={handleDeleteSession}
          />
        </div>
      </div>
    </div>
  );
}
