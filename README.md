# FlowScope

**FlowScope** is a terminal-session capture and reconstruction tool equipped with an optional AI documentation pipeline. It launches a shell inside a Unix pseudo-terminal (PTY), relays I/O to the real terminal, records events as JSON, and transforms the raw interaction into command blocks, clean transcripts, AI-curated guides, and PDF documents.

Unlike conventional command-history loggers, FlowScope captures interaction at the PTY level. This enables it to handle full-screen tools like `vim`, `top`, or `less` without fragmenting the output into noise.

---

## 🛠 Core Pipeline

| Phase                  | Artifact            | Description                                                                                                                            |
| ---------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Recorder**        | `session.json`      | Captures raw terminal input/output events over a real PTY.                                                                             |
| **2. Parser**          | Reconstructed lines | Replays output through a terminal emulator (`pyte`) to resolve cursor movements, overwrites, and escape codes.                         |
| **3. Heuristics**      | `*.blocks.json`     | Groups lines into command blocks and collapses full-screen interactive sessions (`vim`, `top`, etc.) into verbatim interactive blocks. |
| **4. Markdown Export** | `*.transcript.md`   | Generates a deterministic, human-readable session transcript.                                                                          |
| **5. AI Curator**      | `*.guide.md`        | Uses Gemini to infer intent and produce a streamlined technical guide.                                                                 |
| **6. PDF Export**      | `*.guide.pdf`       | Renders the curated Markdown guide into a printable PDF document.                                                                      |


---

## 💻 System & Platform Requirements

* **OS:** Linux or macOS (Windows is **not** supported due to `pty`, `termios`, and `fcntl` dependencies).


* **Python:** 3.x


* **CLI Dependencies:** `typer`, `rich`

* **Parsing & PDF Dependencies:** `pyte`, `reportlab`

* **AI Curation:** Gemini API key (`google-genai` SDK or standard library fallback). `python-dotenv` is optional for loading `.env` files.



---

## 📦 Installation & Setup

1. **Clone the repository structure:**
```
flowscope-project/
├── flowscope.py
├── flowscope_parser.py
├── flowscope_heuristics.py
├── flowscope_markdown.py
├── flowscope_curator.py
├── flowscope_pdf.py
```


2. **Create and activate a virtual environment:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```


3. **Install dependencies:**
```bash
python -m pip install --upgrade pip
python -m pip install typer rich pyte reportlab python-dotenv google-genai
```


4. **Configure API Key (Optional):**
```bash
export GEMINI_API_KEY="your_gemini_api_key"
```



---

## 🚀 Quick Start & CLI Usage

### 1. Record a Terminal Session

Start a recorded shell session. Work normally, then type `exit` or press `Ctrl-D` when finished:

```bash
# Record with automated AI guide and PDF generation
flowscope record --title "Fix Nginx Config"

# Recommended: Capture session only (no external AI calls)
flowscope record --no-guide --title "Fix Nginx Config"
```
Sessions are organized automatically by date:
`sessions/YYYY-MM-DD/<slugified-title>/

### 2. Generate Guides Post-Recording
Process a previously recorded session file:

```bash
flowscope guide sessions/2026-09-09/fix-nginx-config/fix-nginx-config.json \
  --focus "Document the final working configuration and remove failed attempts"
```
### 3. Curate Existing Block Data
Re-run the AI curation step on an existing `blocks.json` file:
```bash
flowscope curate sessions/2026-09-09/fix-nginx-config/fix-nginx-config.blocks.json --out guide.md
```

---

## 🔒 Security & Best Practices

> **Warning regarding Sensitive Data:** FlowScope records raw input and output streams at the PTY level. Keystrokes, passwords, tokens, full-screen editor buffers (`vim`, `nano`), and environment secrets are captured in `session.json` and `blocks.json`

* **Sanitize First:** Always inspect `session.json` and `blocks.json` for secrets before running the AI curator or sharing artifacts externally.
* **Check Interactive Blocks:** Pay special attention to `block_type: "interactive"` entries, as their `raw_output` field contains complete, verbatim buffer contents.
* **Environment:** Perform recording in test environments or with disposable credentials where possible.

---

## 📚 Common Commands Reference

* **Display help:** `flowscope --help`
* **Record with custom output dir:** `flowscope record --dir ./my-sessions`
* **Specify model:** `flowscope record --model gemini-3.6-flash`
* **Provide inline focus:** `flowscope record -f "Create a step-by-step runbook"`

```
