<div align="center">
  <img src="../mosaic-rag-logo.jpg" alt="Project Logo" width="250" style="border-radius: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
</div>

<h1 align="center">
  Mosaic RAG Agent 🧩
</h1>

<p align="center">
  <img alt="Python" src="https://img.shields.io/badge/Python-3.10%2B-blue?style=for-the-badge&logo=python">
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-Ready-green?style=for-the-badge&logo=fastapi">
  <img alt="Google Cloud" src="https://img.shields.io/badge/Google_Cloud-Deployable-red?style=for-the-badge&logo=google-cloud">
  <img alt="License" src="https://img.shields.io/badge/License-Apache-purple?style=for-the-badge">
</p>

<p align="center">
  A powerful <strong>Retrieval-Augmented Generation (RAG)</strong> agent built with the Google Agent Development Kit (ADK) and FastAPI. It connects to a multi-modal Vertex AI Mosaic RAG Corpus and is designed for seamless, one-click deployment to Google Cloud Run.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## ✨ Features

* **Advanced RAG:** Leverages Google's Vertex AI for powerful, multi-modal retrieval from a specified corpus.
* **Agent Development Kit (ADK):** Built on Google's robust framework for creating stateful, multi-turn agents.
* **FastAPI Backend:** A modern, high-performance web framework for serving the agent's API.
* **Cloud Native:** Designed for easy containerization with Docker and one-click deployment to Google Cloud Run.
* **Extensible:** The core logic is modular, making it easy to add new tools or modify agent behavior.

## 🛠️ Tech Stack

* **Backend:** Python, FastAPI
* **AI/ML:** Google Agent Development Kit (ADK), Google Vertex AI
* **Deployment:** Docker, Google Cloud Run, Google Cloud Build
* **CI/CD:** Bash Scripts, `cloudbuild.yaml`

## 🚀 Getting Started

Follow these steps to get the agent running on your local machine.

### Prerequisites

* Python 3.10+ Pip installed
* Google Cloud SDK installed and authenticated (`gcloud auth application-default login`)

### 1. Setup Environment ⚙️

Clone the repository and set up the Python virtual environment.

```bash
git clone https://github.com/arjunvijaygoogle/mosaic-rag-ai.git
cd mosaic-rag-ai
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
```

### 2. Configure 🔑

Copy the sample environment file and fill in your specific configuration details.

```bash
# In the mosaic_rag_agent/ directory
touch .env
cp .env.sample .env
```

Now, open `mosaic_rag_agent/.env` and add your Google Cloud project details and API keys.

### 3. Run the Agent ▶️

Launch the agent using the ADK's web server.

```bash
adk web
```

The agent is now live and accessible at `http://localhost:8000`. You can interact with it via the auto-generated FastAPI documentation at `http://localhost:8000/docs`.

## ☁️ Deployment

The project includes a streamlined deployment process for Google Cloud Run.

1.  **Review Configuration** 📝
    Check the substitution variables in `cloudbuild.yaml` and update them for your environment if necessary (e.g., `_SERVICE_NAME`, `_REGION`).

2.  **Deploy** 🚀
    The provided shell script sets the required IAM permissions and triggers the Cloud Build process.

    ```bash
    chmod +x deploy-agent.sh
    ./deploy-agent.sh your-gcp-project-id
    ```

Your agent will be built, containerized, and deployed. The script will output the final service URL upon completion.

## 📂 Project Structure

```
.
├── mosaic_rag_agent/
│   ├── .env.sample      # Sample environment variables
│   ├── agent.py         # Core ADK agent definition
│   ├── corpus_tools.py  # Tools for querying the RAG corpus
│   └── ...
├── .gitignore
├── cloudbuild.yaml      # Configuration for Cloud Build
├── deploy-agent.sh      # Deployment helper script
├── Dockerfile           # Defines the container for deployment
├── main.py              # FastAPI application entry point
└── README.md            # You are here!
```

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or want to add new features, please feel free to:

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is distributed under the MIT License. See `LICENSE` file for more information.