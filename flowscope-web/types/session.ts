export interface TranscriptLine {
  /** "input" for a typed command, "output" for the resulting terminal output */
  kind: "input" | "output";
  text: string;
}

export interface GuideStep {
  heading: string;
  body: string;
  command?: string;
}

export interface Guide {
  summary: string;
  steps: GuideStep[];
}

export interface Session {
  id: string;
  title: string;
  createdAt: string; // ISO date string
  duration: number; // seconds, 0 if unknown
  favorite: boolean;
  tags: string[];
  commands: string[];
  transcript: TranscriptLine[];
  guide: Guide | null;
  sessionJson: Record<string, unknown>;
  blocksJson: Record<string, unknown> | null;
  notes: string;
}

export type TimeFilter = "all" | "today" | "week" | "older";
export type SortOrder = "newest" | "oldest";

export type TabKey = "overview" | "transcript" | "guide" | "sessionJson" | "blocksJson";
