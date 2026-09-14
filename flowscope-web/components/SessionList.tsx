"use client";

import { Session } from "@/types/session";
import SessionCard from "./SessionCard";
import EmptyState from "./EmptyState";
import styles from "./SessionList.module.css";

interface SessionListProps {
  sessions: Session[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function SessionList({
  sessions,
  selectedId,
  onSelect,
}: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className={styles.emptyWrap}>
        <EmptyState message="No sessions match your filters." />
      </div>
    );
  }

  return (
    <ul className={styles.list} aria-label="Recorded sessions">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          selected={session.id === selectedId}
          onSelect={() => onSelect(session.id)}
        />
      ))}
    </ul>
  );
}
