import { TranscriptLine } from "@/types/session";
import EmptyState from "./EmptyState";
import styles from "./TranscriptTab.module.css";

interface TranscriptTabProps {
  transcript: TranscriptLine[];
}

export default function TranscriptTab({ transcript }: TranscriptTabProps) {
  if (transcript.length === 0) {
    return (
      <div className={styles.wrap}>
        <EmptyState message="No transcript was recorded for this session." />
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.terminal} role="log" aria-label="Session transcript">
        {transcript.map((line, i) =>
          line.kind === "input" ? (
            <div key={i} className={`${styles.line} ${styles.inputLine}`}>
              <span className={styles.prompt} aria-hidden="true">
                $
              </span>
              {line.text}
            </div>
          ) : (
            <div key={i} className={`${styles.line} ${styles.outputLine}`}>
              {line.text}
            </div>
          )
        )}
      </div>
    </div>
  );
}
