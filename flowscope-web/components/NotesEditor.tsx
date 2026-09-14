"use client";

import styles from "./NotesEditor.module.css";

interface NotesEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function NotesEditor({ value, onChange }: NotesEditorProps) {
  return (
    <div className={styles.wrap}>
      <label className={styles.label} htmlFor="session-notes">
        Notes
      </label>
      <textarea
        id="session-notes"
        className={styles.textarea}
        placeholder="Notes about this session..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
