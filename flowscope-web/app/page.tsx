import AppShell from "@/components/AppShell";
import { Session } from "@/types/session";

async function getSessions(): Promise<Session[]> {
  const response = await fetch(`${process.env.FLOWSCOPE_API_URL || "http://127.0.0.1:8002"}/api/sessions`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load FlowScope sessions");
  }

  return response.json();
}

export default async function Home() {
  const sessions = await getSessions();

  return (
    <AppShell
      initialSessions={sessions}
      folderPath="~/Desktop/FlowScope/sessions"
    />
  );
}
