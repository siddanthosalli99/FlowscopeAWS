from __future__ import annotations

import requests
import codecs
import errno
import json
import os
import re
import select
import signal
import struct
import sys
import time
import uuid

try:
    import fcntl
    import pty
    import termios
except ImportError:
    fcntl = None  # type: ignore
    pty = None  # type: ignore
    termios = None  # type: ignore

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path


# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------

try:
    from rich.console import Console
    import typer
except ImportError:
    def _find_venv() -> Path | None:
        """Find a project virtual environment."""

        curr = Path(__file__).resolve().parent

        for path in [curr, *curr.parents]:
            candidate_dir = path / ".venv"

            if not candidate_dir.is_dir():
                continue

            subdir = (
                "Scripts"
                if sys.platform == "win32"
                else "bin"
            )

            for executable in ["python.exe", "python"]:
                executable_path = (
                    candidate_dir
                    / subdir
                    / executable
                )

                if executable_path.exists():
                    return executable_path

        return None

    venv_python = _find_venv()

    if (
        venv_python
        and sys.executable != str(venv_python.resolve())
    ):
        os.execv(
            str(venv_python),
            [str(venv_python)] + sys.argv,
        )

    else:
        sys.exit(
            "Error: 'typer' and 'rich' are required. "
            "Run FlowScope inside its virtual environment."
        )


# ---------------------------------------------------------------------------
# CLI application
# ---------------------------------------------------------------------------

app = typer.Typer(
    name="flowscope",
    help="FlowScope - Terminal Session Recorder",
    add_completion=False,
)

console = Console()

READ_CHUNK = 4096

_SLUG_RE = re.compile(r"[^A-Za-z0-9._-]+")


def _slugify(text: str, max_length: int = 60) -> str:
    """Turn an arbitrary title into a short, filesystem-safe slug.

    Returns "" if nothing usable is left after cleaning.
    """

    slug = _SLUG_RE.sub("-", text.strip()).strip("-")

    return slug[:max_length].strip("-")


def _unique_session_dir(
    day_dir: Path,
    base_name: str,
) -> tuple[Path, str]:
    """Pick a session folder name under `day_dir`, avoiding collisions."""

    candidate = base_name
    n = 2

    while (day_dir / candidate).exists():
        candidate = f"{base_name}-{n}"
        n += 1

    return day_dir / candidate, candidate


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass
class Event:
    """A single input or output event from the terminal session."""

    time: str
    type: str
    text: str


@dataclass
class Session:
    """Raw FlowScope terminal session."""

    session_id: str
    started_at: str
    shell: str
    columns: int = 80
    title: str = ""
    ended_at: str = ""
    duration: float = 0.0
    events: list[Event] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "started_at": self.started_at,
            "shell": self.shell,
            "columns": self.columns,
            "title": self.title,
            "events": [
                asdict(event)
                for event in self.events
            ],
            "ended_at": self.ended_at,
            "duration": self.duration,
        }


# ---------------------------------------------------------------------------
# Terminal helpers
# ---------------------------------------------------------------------------

def _get_size() -> tuple[int, int]:
    """Return terminal size as (rows, columns)."""

    try:
        size = os.get_terminal_size()

        if size.lines <= 0 or size.columns <= 0:
            return 24, 80

        return size.lines, size.columns

    except OSError:
        return 24, 80


def _set_pty_size(
    fd: int,
    rows: int,
    cols: int,
) -> None:
    """Set the size of the pseudo-terminal."""

    winsize = struct.pack(
        "HHHH",
        rows,
        cols,
        0,
        0,
    )

    fcntl.ioctl(
        fd,
        termios.TIOCSWINSZ,
        winsize,
    )


# ---------------------------------------------------------------------------
# Phase 1 - Recorder
# ---------------------------------------------------------------------------

def record_session(
    sessions_dir: Path = Path("sessions"),
    title: str | None = None,
) -> Path:
    """Record an interactive terminal session.

    Artifacts are organized as:

        sessions_dir/
            YYYY-MM-DD/
                <session_name>/
                    <session_name>.json
                    <session_name>.blocks.json
                    <session_name>.transcript.md
                    <session_name>.guide.md
                    <session_name>.guide.pdf
    """

    if (
        pty is None
        or termios is None
        or fcntl is None
    ):
        raise RuntimeError(
            "Terminal session recording requires "
            "a Unix operating system (Linux or macOS)."
        )

    session_id = str(uuid.uuid4())

    started_dt = datetime.now(
        timezone.utc
    )

    date_str = started_dt.strftime(
        "%Y-%m-%d"
    )

    title = title or ""
    slug = _slugify(title)

    base_name = slug or f"session-{session_id[:8]}"

    session_dir, session_name = _unique_session_dir(
        sessions_dir / date_str,
        base_name,
    )

    session_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    session_path = session_dir / f"{session_name}.json"

    shell = os.environ.get(
        "SHELL",
        "/bin/bash",
    )

    is_tty = sys.stdin.isatty()

    stdin_fd = sys.stdin.fileno()
    stdout_fd = sys.stdout.fileno()

    old_settings = (
        termios.tcgetattr(stdin_fd)
        if is_tty
        else None
    )

    rows, cols = _get_size()

    session = Session(
        session_id=session_id,
        started_at=started_dt.isoformat(),
        shell=shell,
        columns=cols,
        title=title,
    )

    # Create a real PTY and fork the shell.
    pid, master_fd = pty.fork()

    if pid == 0:
        # Child process.

        os.execvp(
            shell,
            [shell],
        )

        os._exit(1)

    # Parent process.

    _set_pty_size(
        master_fd,
        rows,
        cols,
    )

    if is_tty:
        import tty

        tty.setraw(stdin_fd)

    def _handle_winch(signum, frame) -> None:
        """Propagate real terminal resizes to the PTY."""

        try:
            new_rows, new_cols = _get_size()
            _set_pty_size(
                master_fd,
                new_rows,
                new_cols,
            )
        except OSError:
            pass

    have_winch = hasattr(signal, "SIGWINCH")

    old_winch_handler = (
        signal.signal(
            signal.SIGWINCH,
            _handle_winch,
        )
        if have_winch
        else None
    )

    input_decoder = codecs.getincrementaldecoder(
        "utf-8"
    )(errors="replace")

    output_decoder = codecs.getincrementaldecoder(
        "utf-8"
    )(errors="replace")

    console.print(
        "[dim]FlowScope is recording this session. "
        "Exit the shell (e.g. `exit` or Ctrl-D) to stop.[/dim]"
    )

    try:
        while True:
            try:
                readable, _, _ = select.select(
                    [stdin_fd, master_fd],
                    [],
                    [],
                    0.25,
                )
            except InterruptedError:
                continue
            except OSError as exc:
                if exc.errno == errno.EINTR:
                    continue
                raise

            if master_fd in readable:
                try:
                    data = os.read(
                        master_fd,
                        READ_CHUNK,
                    )
                except OSError as exc:
                    if exc.errno == errno.EIO:
                        data = b""
                    else:
                        raise

                if not data:
                    break

                os.write(
                    stdout_fd,
                    data,
                )

                text = output_decoder.decode(data)

                if text:
                    session.events.append(
                        Event(
                            time=datetime.now(
                                timezone.utc
                            ).isoformat(),
                            type="output",
                            text=text,
                        )
                    )

            if stdin_fd in readable:
                try:
                    data = os.read(
                        stdin_fd,
                        READ_CHUNK,
                    )
                except OSError:
                    data = b""

                if data:
                    os.write(
                        master_fd,
                        data,
                    )

                    text = input_decoder.decode(data)

                    if text:
                        session.events.append(
                            Event(
                                time=datetime.now(
                                    timezone.utc
                                ).isoformat(),
                                type="input",
                                text=text,
                            )
                        )

            try:
                waited_pid, _status = os.waitpid(
                    pid,
                    os.WNOHANG,
                )
            except ChildProcessError:
                break

            if waited_pid == pid:
                break

    finally:
        if (
            have_winch
            and old_winch_handler is not None
        ):
            signal.signal(
                signal.SIGWINCH,
                old_winch_handler,
            )

        if old_settings is not None:
            termios.tcsetattr(
                stdin_fd,
                termios.TCSADRAIN,
                old_settings,
            )

        try:
            os.close(master_fd)
        except OSError:
            pass

    ended_dt = datetime.now(
        timezone.utc
    )

    session.ended_at = ended_dt.isoformat()

    session.duration = (
        ended_dt - started_dt
    ).total_seconds()

    session_data = session.to_dict()

    session_path.write_text(
        json.dumps(
            session_data,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    return session_path


# ---------------------------------------------------------------------------
# Remote API upload
# ---------------------------------------------------------------------------

def _upload_session(
    session_path: Path,
    artifacts: dict[str, str],
) -> None:
    """Upload a completed session and its generated artifacts."""

    api_url = os.environ.get(
        "FLOWSCOPE_API_URL"
    )

    if not api_url:
        return

    try:
        session_data = json.loads(
            session_path.read_text(
                encoding="utf-8"
            )
        )

        response = requests.post(
            f"{api_url.rstrip('/')}/api/sessions",
            json={
                "session": session_data,
                "artifacts": artifacts,
            },
            timeout=10,
        )

        response.raise_for_status()

        console.print(
            "[green]Session uploaded to FlowScope API.[/green]"
        )

    except requests.RequestException as exc:
        console.print(
            "[yellow]Session saved locally, but upload failed: "
            f"{exc}[/yellow]"
        )


# ---------------------------------------------------------------------------
# Pipeline glue (Phases 2-6)
# ---------------------------------------------------------------------------

def _run_guide_pipeline(
    session_path: Path,
    api_key: str | None = None,
    model: str = "gemini-3.6-flash",
    focus: str | None = None,
) -> None:
    """Run Phases 2-6 on a recorded session.

    The session and generated artifacts are uploaded only after the
    command blocks and transcript have been generated.
    """

    from flowscope_heuristics import session_blocks_payload
    from flowscope_markdown import render_markdown
    from flowscope_curator import curate_file
    from flowscope_pdf import render_markdown_to_pdf

    stem = session_path.stem

    blocks_path = session_path.with_name(
        f"{stem}.blocks.json"
    )

    transcript_path = session_path.with_name(
        f"{stem}.transcript.md"
    )

    curated_path = session_path.with_name(
        f"{stem}.guide.md"
    )

    pdf_path = session_path.with_name(
        f"{stem}.guide.pdf"
    )

    console.print(
        "[dim]Parsing session and grouping command blocks...[/dim]"
    )

    payload = session_blocks_payload(
        session_path
    )

    blocks_text = json.dumps(
        payload,
        indent=2,
        ensure_ascii=False,
    )

    blocks_path.write_text(
        blocks_text,
        encoding="utf-8",
    )

    console.print(
        f"[green]Blocks:[/green]     {blocks_path}"
    )

    transcript = render_markdown(
        blocks_path
    )

    transcript_path.write_text(
        transcript,
        encoding="utf-8",
    )

    console.print(
        f"[green]Transcript:[/green] {transcript_path}"
    )

    # Upload the raw session together with the generated blocks and
    # transcript. This is the important part: the AWS API now receives
    # blocks.json, so the frontend can display the commands.
    session_id = json.loads(session_path.read_text(encoding="utf-8"))["session_id"]
    artifacts = {
        f"{session_id}.blocks.json": blocks_text,
        f"{session_id}.transcript.md": transcript,
    }

    _upload_session(
        session_path,
        artifacts,
    )

    console.print(
        "[dim]Sending session data to Gemini to identify the goal and "
        "draft an efficient guide...[/dim]"
    )

    try:
        curated = curate_file(
            input_path=blocks_path,
            out_path=curated_path,
            api_key=api_key,
            model=model,
            focus=focus,
        )

    except Exception as exc:
        console.print(
            f"[red]AI curation failed:[/red] {exc}"
        )

        console.print(
            "[dim]The transcript above is unaffected. Retry curation "
            f"later with: flowscope curate {blocks_path}[/dim]"
        )

        return

    console.print(
        f"[green]Curated guide:[/green] {curated_path}"
    )

    render_markdown_to_pdf(
        curated,
        pdf_path,
    )

    console.print(
        f"[green]PDF guide:[/green]    {pdf_path}"
    )


# ---------------------------------------------------------------------------
# CLI commands
# ---------------------------------------------------------------------------

@app.command()
def record(
    sessions_dir: Path = typer.Option(
        Path("sessions"),
        "--dir",
        "-d",
        help="Directory to store the recorded session.",
    ),
    title: str | None = typer.Option(
        None,
        "--title",
        "-t",
        help="Optional title for the session, folded into the filename and stored in session.json.",
    ),
    guide: bool = typer.Option(
        True,
        "--guide/--no-guide",
        help="Generate parse/blocks/transcript/AI guide/PDF right after recording.",
    ),
    api_key: str | None = typer.Option(
        None,
        "--api-key",
        "-k",
        help="Gemini API key (or set GEMINI_API_KEY).",
    ),
    model: str = typer.Option(
        "gemini-3.6-flash",
        "--model",
        "-m",
        help="Gemini model to use for curation.",
    ),
    focus: str | None = typer.Option(
        None,
        "--focus",
        "-f",
        help="Optional hint about the goal of the session, to help curation.",
    ),
) -> None:
    """Record a terminal session, then turn it into a guide."""

    try:
        session_path = record_session(
            sessions_dir=sessions_dir,
            title=title,
        )

    except RuntimeError as exc:
        console.print(
            f"[red]{exc}[/red]"
        )

        raise typer.Exit(
            code=1
        )

    console.print(
        f"[green]Session recorded:[/green] {session_path}"
    )

    if guide:
        _run_guide_pipeline(
            session_path,
            api_key=api_key,
            model=model,
            focus=focus,
        )

    else:
        console.print(
            f"[dim]Run `flowscope guide {session_path}` "
            "whenever you're ready to generate the guide.[/dim]"
        )


@app.command()
def guide(
    session_path: Path = typer.Argument(
        ...,
        help="Path to a recorded session.json.",
    ),
    api_key: str | None = typer.Option(
        None,
        "--api-key",
        "-k",
        help="Gemini API key (or set GEMINI_API_KEY).",
    ),
    model: str = typer.Option(
        "gemini-3.6-flash",
        "--model",
        "-m",
        help="Gemini model to use for curation.",
    ),
    focus: str | None = typer.Option(
        None,
        "--focus",
        "-f",
        help="Optional hint about the goal of the session, to help curation.",
    ),
) -> None:
    """Run the full Phase 2-6 pipeline on an existing recorded session."""

    if not session_path.exists():
        console.print(
            f"[red]Session file not found:[/red] {session_path}"
        )

        raise typer.Exit(
            code=1
        )

    _run_guide_pipeline(
        session_path,
        api_key=api_key,
        model=model,
        focus=focus,
    )


@app.command()
def curate(
    blocks_path: Path = typer.Argument(
        ...,
        help="Path to a blocks.json produced by the heuristics phase.",
    ),
    out: Path | None = typer.Option(
        None,
        "--out",
        "-o",
        help="Where to write the curated Markdown guide.",
    ),
    api_key: str | None = typer.Option(
        None,
        "--api-key",
        "-k",
        help="Gemini API key (or set GEMINI_API_KEY).",
    ),
    model: str = typer.Option(
        "gemini-3.6-flash",
        "--model",
        "-m",
        help="Gemini model to use for curation.",
    ),
    focus: str | None = typer.Option(
        None,
        "--focus",
        "-f",
        help="Optional hint about the goal of the session, to help curation.",
    ),
) -> None:
    """Send an existing blocks.json to Gemini and print/save the guide."""

    from flowscope_curator import curate_file

    try:
        curated = curate_file(
            input_path=blocks_path,
            out_path=out,
            api_key=api_key,
            model=model,
            focus=focus,
        )

    except Exception as exc:
        console.print(
            f"[red]AI curation failed:[/red] {exc}"
        )

        raise typer.Exit(
            code=1
        )

    if out:
        console.print(
            f"[green]Curated guide written to:[/green] {out}"
        )

    else:
        console.print(curated)


if __name__ == "__main__":
    app()