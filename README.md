# FlowScope

**FlowScope** is a lightweight developer workflow monitoring and session-recording tool designed to capture, store, and visualize terminal activity during development sessions.

It provides a simple way to record development sessions from the CLI and view them through a web interface backed by a FastAPI service.

## Features

* Record terminal sessions from the command line
* Send recorded sessions to a remote FlowScope API
* Store and retrieve recorded sessions
* Web-based session viewing
* FastAPI backend
* Docker-based deployment
* AWS EC2 deployment
* Simple CLI workflow
* Lightweight architecture suitable for personal projects and development environments

## Architecture

```text
Developer
    │
    │  flowscope.py
    ▼
FlowScope CLI
    │
    │ HTTP
    ▼
FlowScope API
    │
    ▼
Session Storage
    │
    ▼
Web Interface
```

The CLI is responsible for recording the session and communicating with the backend API. The API handles session storage and serves the data required by the web interface.

## Tech Stack

* **Python**
* **FastAPI**
* **Docker**
* **Docker Compose**
* **HTML / CSS / JavaScript**
* **AWS EC2**
* **Git & GitHub**

## Project Structure

```text
FlowScope/
├── flowscope.py
├── flowscope_api.py
├── docker-compose.yml
├── requirements.txt
├── README.md
└── ...
```

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd FlowScope
```

### 2. Create a virtual environment

```bash
python3 -m venv .venv
```

Activate it:

```bash
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

## Running FlowScope Locally

Start the FlowScope API:

```bash
uvicorn flowscope_api:app --host 0.0.0.0 --port 8002
```

The API will be available at:

```text
http://localhost:8002
```

Set the API URL used by the CLI:

```bash
export FLOWSCOPE_API_URL="http://localhost:8002"
```

Start recording a session:

```bash
python flowscope.py record
```

FlowScope will begin recording the terminal session.

Exit the recording session when finished.

## Running with Docker

FlowScope can also be run using Docker Compose.

```bash
docker compose up -d
```

Check running containers:

```bash
docker compose ps
```

To view the application logs:

```bash
docker compose logs
```

## Using the CLI

The primary CLI workflow is:

```bash
python flowscope.py record
```

The CLI uses the `FLOWSCOPE_API_URL` environment variable to determine where recorded sessions should be sent.

Example:

```bash
export FLOWSCOPE_API_URL="http://localhost:8002"
python flowscope.py record
```

For a remotely deployed FlowScope API:

```bash
export FLOWSCOPE_API_URL="http://<server-ip>:8002"
python flowscope.py record
```

## AWS Deployment

FlowScope is currently deployed on an **AWS EC2** instance using Docker.

The deployment consists of:

```text
Local Machine
     │
     │ HTTP requests
     ▼
AWS EC2
     │
     ▼
Docker
     │
     ├── FlowScope API
     │
     └── Web Interface
```

After deploying the API, configure the CLI to communicate with the EC2 instance:

```bash
export FLOWSCOPE_API_URL="http://<EC2-IP>:8002"
```

Then start recording:

```bash
python flowscope.py record
```

> **Note:** The EC2 instance and network configuration may incur AWS charges depending on the account, region, instance type, usage, and applicable Free Tier eligibility.

## API

The backend is implemented using FastAPI.

Once the API is running, the interactive API documentation is available at:

```text
http://localhost:8002/docs
```

The OpenAPI specification can also be accessed through FastAPI's standard endpoints.

## Development Workflow

FlowScope was built using a development workflow centered around:

```text
Development
    ↓
Git
    ↓
GitHub
    ↓
Docker
    ↓
AWS EC2
    ↓
Running Application
```

This project also provided hands-on experience with containerization, API development, deployment, and remote application management.

## Why FlowScope?

Development sessions often involve multiple commands, experiments, configuration changes, and debugging steps. FlowScope provides a way to capture those sessions and make them accessible through a centralized interface.

The project was also designed as a practical exercise in combining:

* Backend development
* CLI tooling
* Docker
* API communication
* Cloud deployment
* DevOps workflows

## Future Improvements

Potential future improvements include:

* User authentication
* Persistent database storage
* Session search and filtering
* Session metadata
* Better session visualization
* HTTPS support
* Custom domain
* Automated deployment through CI/CD
* Improved frontend UI
* Multi-user support

## Author

**Siddant Hosalli**

Built as a practical project exploring **Python, FastAPI, Docker, cloud deployment, and MLOps/DevOps workflows**.
