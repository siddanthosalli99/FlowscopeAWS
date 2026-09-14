"use client";

import { Heart } from "lucide-react";
import { Session, TabKey } from "@/types/session";
import SessionTabs from "./SessionTabs";
import OverviewTab from "./OverviewTab";
import TranscriptTab from "./TranscriptTab";
import GuideTab from "./GuideTab";
import JsonViewer from "./JsonViewer";
import AddTagButton, { TagChip } from "./TagButton";
import styles from "./SessionDetails.module.css";

interface SessionDetailsProps {
  session: Session | null;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onToggleFavorite: (id: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  onNotesChange: (id: string, notes: string) => void;
  onDeleteSession: (id: string) => void;
}

export default function SessionDetails({
  session,
  activeTab,
  onTabChange,
  onToggleFavorite,
  onAddTag,
  onRemoveTag,
  onNotesChange,
  onDeleteSession,
}: SessionDetailsProps) {
  if (!session) {
    return (
      <div className={styles.emptyWrap}>
        <p className={styles.emptyText}>Select a session to view it.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h1 className={styles.title}>{session.title}</h1>
        <button
          type="button"
          className={styles.favButton}
          onClick={() => onToggleFavorite(session.id)}
          aria-pressed={session.favorite}
          aria-label={
            session.favorite ? "Remove from favorites" : "Add to favorites"
          }
        >
          <Heart
            size={22}
            fill={session.favorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      <p className={styles.metaLine}>
        {session.commands.length} command
        {session.commands.length === 1 ? "" : "s"}
      </p>

      <div className={styles.tagArea}>
        {session.tags.map((tag) => (
          <TagChip
            key={tag}
            label={tag}
            onRemove={() => onRemoveTag(session.id, tag)}
          />
        ))}
        <AddTagButton onAdd={(tag) => onAddTag(session.id, tag)} />
      </div>

      <SessionTabs activeTab={activeTab} onTabChange={onTabChange} />

      {activeTab === "overview" && (
        <OverviewTab
          session={session}
          onNotesChange={(notes) => onNotesChange(session.id, notes)}
          onDeleteSession={() => onDeleteSession(session.id)}
        />
      )}
      {activeTab === "transcript" && (
        <TranscriptTab transcript={session.transcript} />
      )}
      {activeTab === "guide" && <GuideTab guide={session.guide} />}
      {activeTab === "sessionJson" && (
        <JsonViewer
          data={session.sessionJson}
          emptyMessage="No session.json available."
        />
      )}
      {activeTab === "blocksJson" && (
        <JsonViewer
          data={session.blocksJson}
          emptyMessage="No blocks.json for this session — run the AI/heuristics pipeline to see commands here."
        />
      )}
    </div>
  );
}
