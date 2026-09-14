"use client";

import { useState } from "react";
import { Session } from "@/types/session";
import StatsCard from "./StatsCard";
import NotesEditor from "./NotesEditor";
import styles from "./OverviewTab.module.css";

interface OverviewTabProps {
  session: Session;
  onNotesChange: (notes: string) => void;
  onDeleteSession: () => void;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function OverviewTab({
  session,
  onNotesChange,
  onDeleteSession,
}: OverviewTabProps) {
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  function handleRevealInFolder() {
    setStatusMsg(`Would open the containing folder for "${session.title}".`);
    window.setTimeout(() => setStatusMsg(null), 3000);
  }

  function handleDelete() {
    const confirmed = window.confirm(
      `Delete session "${session.title}"? This can't be undone.`
    );
    if (confirmed) {
      onDeleteSession();
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.statsRow}>
        <StatsCard value={String(session.commands.length)} label="COMMANDS" />
        <StatsCard value={formatDuration(session.duration)} label="DURATION" />
        <StatsCard
          value={session.guide ? "Yes" : "No"}
          label="GUIDE GENERATED"
        />
      </div>

      {session.commands.length > 0 && (
        <div className={styles.commandsSection}>
          <h3 className={styles.sectionTitle}>Commands</h3>

          <div className={styles.commandsList}>
            {session.commands.map((command, index) => (
              <div key={`${command}-${index}`} className={styles.commandItem}>
                <span className={styles.commandNumber}>{index + 1}</span>
                <code>{command}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {!session.blocksJson && (
        <p className={styles.emptyBlocks}>
          No blocks.json for this session — run the AI/heuristics pipeline to
          see commands here.
        </p>
      )}

      <NotesEditor value={session.notes} onChange={onNotesChange} />

      <hr className={styles.divider} />

      <div className={styles.actionsRow}>
        <button
          type="button"
          className={`${styles.actionButton} fs-raised`}
          disabled={!session.guide}
          onClick={() => setStatusMsg("Opening the generated PDF guide...")}
        >
          Open PDF
        </button>

        <button
          type="button"
          className={`${styles.actionButton} fs-raised`}
          onClick={handleRevealInFolder}
        >
          Reveal in Folder
        </button>

        <button
          type="button"
          className={`${styles.actionButton} ${styles.dangerButton} fs-raised`}
          onClick={handleDelete}
        >
          Delete Session...
        </button>
      </div>

      {statusMsg && <p className={styles.statusMsg}>{statusMsg}</p>}
    </div>
  );
}