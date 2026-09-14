import { Guide } from "@/types/session";
import EmptyState from "./EmptyState";
import styles from "./GuideTab.module.css";

interface GuideTabProps {
  guide: Guide | null;
}

export default function GuideTab({ guide }: GuideTabProps) {
  if (!guide) {
    return (
      <div className={styles.wrap}>
        <EmptyState message="No guide has been generated for this session yet — run the AI/heuristics pipeline to create one." />
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.summary}>{guide.summary}</p>
      {guide.steps.map((step, i) => (
        <div key={i} className={`${styles.step} fs-raised`}>
          <h3 className={styles.stepHeading}>
            <span className={styles.stepNumber}>{i + 1}</span>
            {step.heading}
          </h3>
          <p className={styles.stepBody}>{step.body}</p>
          {step.command && (
            <code className={styles.stepCommand}>{step.command}</code>
          )}
        </div>
      ))}
    </div>
  );
}
