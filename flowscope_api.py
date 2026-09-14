from pathlib import Path
import json

from fastapi import FastAPI

app = FastAPI(title="FlowScope API")

SESSIONS_DIR = Path(__file__).resolve().parent / "sessions"


def load_session(session_file: Path) -> dict:
    """Convert a FlowScope session directory into the frontend Session shape."""
    data = json.loads(session_file.read_text(encoding="utf-8"))

    session_dir = session_file.parent
    stem = session_file.stem

    blocks_file = session_dir / f"{stem}.blocks.json"
    transcript_file = session_dir / f"{stem}.transcript.md"
    guide_file = session_dir / f"{stem}.guide.md"

    blocks_data = None
    commands = []
    transcript = []

    if blocks_file.exists():
        blocks_data = json.loads(blocks_file.read_text(encoding="utf-8"))
        for block in blocks_data.get("blocks", []):
            command = block.get("command")

            if command:
                commands.append(command)
                transcript.append(
                    {
                        "kind": "input",
                        "text": command,
                    }
                )

            for output in block.get("output", []):
                transcript.append(
                    {
                        "kind": "output",
                        "text": output,
                    }
            )

    return {
        "id": data["session_id"],
        "title": data.get("title") or stem,
        "createdAt": data["started_at"],
        "duration": data.get("duration", 0),
        "favorite": False,
        "tags": [],
        "commands": commands,
        "transcript": transcript,
        "guide": (
            {
                "summary": guide_file.read_text(encoding="utf-8"),
                "steps": [],
            }
            if guide_file.exists()
            else None
        ),
        "sessionJson": data,
        "blocksJson": blocks_data,
        "notes": "",
    }


@app.get("/api/sessions")
def get_sessions():
    sessions = []

    for session_file in SESSIONS_DIR.glob("*/*/*.json"):
        if session_file.name.endswith(".blocks.json"):
            continue

        sessions.append(load_session(session_file))

    return sessions
