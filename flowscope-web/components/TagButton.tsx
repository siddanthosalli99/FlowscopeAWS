"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import styles from "./TagButton.module.css";

interface TagChipProps {
  label: string;
  onRemove: () => void;
}

export function TagChip({ label, onRemove }: TagChipProps) {
  return (
    <span className={`${styles.chip} fs-raised`}>
      {label}
      <button
        type="button"
        className={styles.removeBtn}
        onClick={onRemove}
        aria-label={`Remove tag ${label}`}
      >
        <X size={12} />
      </button>
    </span>
  );
}

interface AddTagButtonProps {
  onAdd: (tag: string) => void;
}

export default function AddTagButton({ onAdd }: AddTagButtonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");

  function submit() {
    if (value.trim().length > 0) {
      onAdd(value);
    }
    setValue("");
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        className={`${styles.addButton} fs-raised`}
        onClick={() => setIsEditing(true)}
      >
        <Plus size={12} style={{ marginRight: 4, verticalAlign: -2 }} />
        add tag
      </button>
    );
  }

  return (
    <form
      className={styles.addForm}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input
        autoFocus
        type="text"
        className={styles.addInput}
        placeholder="tag name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (value.trim().length === 0) setIsEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setValue("");
            setIsEditing(false);
          }
        }}
        aria-label="New tag name"
      />
      <button type="submit" className={`${styles.smallBtn} fs-raised`}>
        Add
      </button>
    </form>
  );
}
