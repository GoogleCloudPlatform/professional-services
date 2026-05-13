# 🐳 Docker Setup & Usage

Running the Computer Use Evaluation Pipeline in Docker ensures a reproducible, identical OS environment (Debian 12 "Bookworm") for all developers and CI/CD systems. This guarantees **"OS Parity"**—meaning Playwright browser automation behaves exactly the same everywhere.

---

## 1. First-Time Setup

### A. Provide Google Cloud Credentials
The Docker container needs your host machine's Google Cloud credentials to talk to Vertex AI. 
Run this on your host machine (laptop/desktop):
```bash
gcloud auth application-default login
```
*Note: The container is configured to mount these credentials as **read-only**, ensuring your host security is never compromised.*

### B. Configure Environment Variables
Copy the example Docker environment file:
```bash
cp .env.docker.example .env.docker
```

Open `.env.docker` and configure your GCP Project ID:
```env
GCP_PROJECT_ID="your-project-id"
```
*(The helper script will automatically handle UID/GID mapping and Timezones for you).*

---

## 2. Running Benchmarks

We provide a simple wrapper script that automatically handles all the complex Docker Compose permissions, volume mounts, and network routing.

### The Fast Way (Pure Headless)
This is the default mode. It runs Chromium in `headless=True` mode without a virtual display. It is the fastest and most resource-efficient way to run standard benchmarks.

```bash
./scripts/run_docker.sh --benchmark config/benchmarks/google_search.yaml
```

### The High-Fidelity Way (Virtual Display / Xvfb)
If an agent struggles to "see" native OS elements (like standard `<select>` dropdowns), you can force the container to boot a virtual 1080p monitor in memory and run Chromium in headed mode.

```bash
USE_XVFB=true PLAYWRIGHT_HEADLESS=false ./scripts/run_docker.sh --benchmark config/benchmarks/google_search.yaml
```

---

## 3. Viewing Results (Artifacts)

You **do not** need to SSH or `exec` into the Docker container to view the results.

The container uses dynamic UID/GID mapping to write all screenshots, video recordings, and `result.json` files directly to your host machine's `./artifacts` folder. 

Simply open the `artifacts/` folder in your IDE or file explorer on your laptop to view the run outputs.

---

## 4. Rebuilding the Sandbox

If you add new dependencies to `pyproject.toml` or `uv.lock`, you must rebuild the Docker image:

```bash
docker compose build eval-agent
```

*(Note: The build process uses a `.dockerignore` file to skip transferring large artifact files, ensuring builds remain fast).*

---

## 🛠️ Advanced: Architecture Details

For staff engineers debugging the container, here is how it is architected:

- **Base Image:** `python:3.12-slim`
- **Rootless Volumes:** `docker-compose.yaml` dynamically binds `${USER_ID}` and `${GROUP_ID}`.
- **Shared Memory:** Hardened with `shm_size: '2gb'` to prevent silent Chromium crashes on heavy pages.
- **Zombies:** Uses `init: true` and the `exec` pattern in `entrypoint.sh` to ensure proper SIGTERM routing.
- **Local Dev Servers:** Binds `host.docker.internal` so the containerized agent can navigate to `localhost` servers running on your Mac/Linux host.