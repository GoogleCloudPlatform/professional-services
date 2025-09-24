# Kubescan | Multi-Cloud Kubernetes Cluster Discovery

A command-line interface (CLI) tool to discover Kubernetes clusters on AWS (EKS), Azure (AKS), and Google Cloud (GKE), to aid in migration planning to Google Kubernetes Engine.
## Features

-   **Unified CLI**: A single, easy-to-use interface to discover Kubernetes resources.
-   **Multi-Cloud**: Supports AWS (EKS), Azure (AKS), and GKE.
-   **Rich Output**: Displays data in clean, colorful tables in your terminal.
-   **CSV Export**: Save all discovered data to CSV files for further analysis.
-   **Graceful Authentication**: Automatically uses your existing cloud CLI credentials.

## Development Setup
You can set up the development environment in two ways: using [uv](https://docs.astral.sh/uv/getting-started/installation/) or a Python virtual environment.

### Option 1: Setup with uv


1.  **Clone the repository**:
    ```bash
    git clone <your-repo-url>
    cd <repo-name>
    ```

2.  **Install dependencies**:
    ```bash
    uv sync
    ```

3.  **Run program in the virtual environment**:
    ```bash
        # Run the discovery tool for AWS (will output to ./discovery_output)
        uv run -- kraw aws --region us-west-2

        # Run the discovery tool for Azure
        uv run -- kraw azure --subscription-id "your-subscription-id"

        # Run the discovery tool for GKE
        uv run -- kraw gke --project-id "your-gcp-project-id"
    ```

### Option 2: Setup with Python Virtual Environment
1.  **Clone the repository**:
    ```bash
    git clone <your-repo-url>
    cd <repo-name>
    ```

2. **Create and activate a virtual environment**:
```bash
python3 -m venv .venv
source .venv/bin/activate   # On Linux/Mac
.venv\Scripts\activate      # On Windows
```
3. **Install dependencies:**:
```bash
pip3 install -r requirements.txt
```

4. **Run the CLI:**:
```bash
python main.py aws --region us-west-2
python main.py azure --subscription-id "your-subscription-id"
python main.py gke --project-id "your-gcp-project-id"
```


## Authentication

The tool uses the default credential chains for each cloud provider.

-   **AWS**: Make sure you have the AWS CLI installed and configured. You can do this by running `aws configure`.
-   **Azure**: Make sure you have the Azure CLI installed. Log in by running `az login`.
-   **GKE**: Make sure you have the Google Cloud CLI installed. Log in by running `gcloud auth application-default login`.

## Usage

### Discover AWS EKS Clusters

You can scan specific AWS regions using the `--region` option. If no region is specified, the tool will automatically scan all AWS regions where EKS is available.

**Scan a specific region:**
```bash
kraw aws --region us-west-2 --output-dir ./aws-discovery-output
```

**Scan multiple regions:**
```bash
kraw aws --region us-east-1 --region us-west-2
```

### Discover Azure AKS Clusters

To scan specific subscriptions, use the `--subscription-id` option. You can use it multiple times. If no subscriptions are specified, all accessible subscriptions are scanned.
```bash
kraw azure --subscription-id "your-subscription-id" --output-dir ./azure-discovery-output
```

### Discover GKE Resources

For GKE discovery, it is mandatory to provide a scope. You must specify either one or more project IDs or a single organization ID.

Scan by Project ID:
Use the `--project-id` option to scan one or more specific GCP projects.

```bash
kraw gke --project-id "your-gcp-project-id" --output-dir ./gke-discovery-output
```

```bash
kraw gke --project-id "project-a" --project-id "project-b"
```

Scan by Organization ID:

Use the `--gcp-organization-id` option to discover and scan all projects within a specific GCP organization.

```bash 
kraw gke --gcp-organization-id "123456789012" --output-dir ./gke-discovery-output
```

## Packaging the Application

### Install PyInstaller as a dev dependency
`uv add -D pyinstaller`
 
### Run PyInstaller
`uv run pyinstaller --onefile --name kraw main.py`