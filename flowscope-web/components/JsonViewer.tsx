import { Fragment } from "react";
import EmptyState from "./EmptyState";
import styles from "./JsonViewer.module.css";

interface JsonViewerProps {
  data: Record<string, unknown> | null;
  emptyMessage: string;
}

const TOKEN_RE =
  /("(?:\\.|[^"\\])*"(?:\s*:)?|\b(?:true|false)\b|\bnull\b|-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g;

function renderHighlighted(json: string) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(json)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={key++}>{json.slice(lastIndex, match.index)}</Fragment>
      );
    }

    const token = match[0];
    let className = styles.string;

    if (/^".*"\s*:$/.test(token)) {
      className = styles.key;
    } else if (/^"/.test(token)) {
      className = styles.string;
    } else if (token === "true" || token === "false") {
      className = styles.boolean;
    } else if (token === "null") {
      className = styles.null;
    } else {
      className = styles.number;
    }

    nodes.push(
      <span key={key++} className={className}>
        {token}
      </span>
    );

    lastIndex = match.index + token.length;
  }

  if (lastIndex < json.length) {
    nodes.push(<Fragment key={key++}>{json.slice(lastIndex)}</Fragment>);
  }

  return nodes;
}

export default function JsonViewer({ data, emptyMessage }: JsonViewerProps) {
  if (!data) {
    return (
      <div className={styles.wrap}>
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  const json = JSON.stringify(data, null, 2);

  return (
    <div className={styles.wrap}>
      <pre className={styles.pre}>
        <code>{renderHighlighted(json)}</code>
      </pre>
    </div>
  );
}
