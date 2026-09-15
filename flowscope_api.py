from pathlib import Path
import json

from fastapi import FastAPI, HTTPException
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
@app.post("/api/sessions")
def upload_session(payload: dict):
    session_data = payload.get("session")
    
    if not session_data:
        raise HTTPException(status_code=400, detail="Missing session data")

    session_id = session_data.get("session_id")
    started_at = session_data.get("started_at")

    if not session_id or not started_at:
        raise HTTPException(status_code=400, detail="Invalid session data")

    date_str = started_at[:10]
    session_name = session_id

    session_dir = SESSIONS_DIR / date_str / session_name
    session_dir.mkdir(parents=True, exist_ok=True)

    session_file = session_dir / f"{session_name}.json"

    session_file.write_text(
        json.dumps(session_data, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    for filename, content in payload.get("artifacts", {}).items():
        (session_dir / filename).write_text(
            content,
            encoding="utf-8",
        )

    return {
        "status": "uploaded",
        "session_id": session_id,
    }