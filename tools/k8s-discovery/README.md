# Kubernetes Cluster Discovery Tool

A comprehensive Python-based CLI tool designed to discover and inventory Kubernetes clusters across multiple cloud providers (AWS EKS, Azure AKS, Google GKE) as well as generic or local clusters (MicroK8s, Minikube, K3s, On-Premises).

This tool connects to clusters, fetches detailed inventories of resources (Nodes, Workloads, Storage, Networking), and exports the data into structured JSON and flat CSV files suitable for reporting and analysis.

---

## 🚀 Features

* **Multi-Cloud Support:** Native discovery for **AWS EKS**, **Azure AKS**, and **Google GKE** using cloud-specific SDKs.
* **Generic Cluster Support:** Works with **any** Kubernetes cluster (MicroK8s, Minikube, On-prem, Rancher) via standard `kubeconfig`.
* **Detailed Inventory:** Captures configuration and status for:
    * Nodes & Nodepools (Machine types, Kernel versions, OS images)
    * Workloads (Deployments, StatefulSets, DaemonSets, Pods)
    * Networking (Services, Ingresses)
    * Storage (PVCs, PVs)
    * Config (ConfigMaps, Secrets, Resource Quotas)
* **Data Export:**
    * **JSON:** Hierarchical dump of all raw data.
    * **CSV:** Relational, flattened files (e.g., `workloads.csv`, `nodes.csv`) ready for Excel or SQL import.
* **Robust Error Handling:** Includes null-safety checks for container resources to prevent crashes on misconfigured pods.

---

## 📋 Prerequisites

### 1. System Requirements
* **Python 3.9+**
* `pip` (Python package manager)

### 2. Credentials
Depending on which clusters you intend to scan, you need the following:

* **Generic / Local:** A valid `kubeconfig` file (e.g., `~/.kube/config` or `microk8s config`).
* **AWS EKS:** AWS CLI configured with permissions (`eks:ListClusters`, `eks:DescribeCluster`).
* **Azure AKS:** Azure CLI logged in with Reader permissions on subscriptions.
* **Google GKE:** Google Cloud SDK (`gcloud`) authenticated with Application Default Credentials.

---

## 🛠️ Installation

It is **highly recommended** to run this tool in a virtual environment to avoid conflicts with system packages (especially on modern Linux distros like Ubuntu 24.04).

1.  **Create a virtual environment:**
    ```bash
    python3 -m venv venv
    ```

2.  **Activate the environment:**
    * **Linux/macOS:**
        ```bash
        source venv/bin/activate
        ```
    * **Windows:**
        ```bash
        .\venv\Scripts\activate
        ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

---

## 📖 Usage Guide

The tool is divided into sub-commands based on the provider.

### 1. Generic / Local Clusters (MicroK8s, Minikube, On-Prem)
Use this for clusters that do not require Cloud API access, such as local development environments.

**Basic Usage (uses default `~/.kube/config`):**
```bash
python main.py generic
```

### Specific Kubeconfig (e.g., MicroK8s): 
If you are running MicroK8s, you must export the config first:
```
# 1. Export config to a file
microk8s config > microk8s.yaml

# 2. Run discovery using that file
python main.py generic --kubeconfig ./microk8s.yaml
```

### Filter by Context: 
If your kubeconfig contains many contexts, scan only specific ones:
```
python main.py generic --context my-dev-cluster --context my-prod-cluster
```

## 2. AWS EKS (Elastic Kubernetes Service)
Scans AWS regions for EKS clusters.
```
# Scan ALL available AWS regions
python main.py aws

# Scan specific regions only
python main.py aws --region us-east-1 --region eu-west-1
```
## 3. Azure AKS (Azure Kubernetes Service)
Scans Azure subscriptions for AKS clusters.
```
# Scan ALL accessible subscriptions
python main.py azure

# Scan specific subscription IDs
python main.py azure --subscription-id "subscription-guid-1" --subscription-id "subscription-guid-2"
```
## 4. Google GKE (Google Kubernetes Engine)
Scans Google Cloud projects for GKE clusters.
```
# Scan specific projects (Required)
python main.py gke --project-id "my-gcp-project-dev" --project-id "my-gcp-project-prod"

# Scan an entire GCP Organization (Requires Org-level permissions)
python main.py gke --gcp-organization-id "123456789012"
```
# 📂 Output
By default, results are saved to the ./discovery_output directory. You can change this using the --output-dir flag.

## Key Output Files:
| File Name | Description |
| :--- | :--- |
| `[provider]_clusters.csv` | High-level cluster summary (Name, Version, Region, Status). |
| `nodes.csv` | Node details including CPU/Memory capacity, Kernel version, OS Image. |
| `nodepools.csv` | (Cloud Only) Details about node groups/agent pools. |
| `workloads.csv` | Flattened list of Deployments, StatefulSets, DaemonSets with resource requests/limits. |
| `pods.csv` | Individual Pod statuses, IPs, and Node assignment. |
| `services.csv` | Network services, ClusterIPs, and Ports. |
| `persistent_volume_claims.csv` | Storage requests and binding status. |
| `generic_data.json` | Complete hierarchical JSON dump of the raw discovery data. |
