# GKE Autopilot Terraform Module

This Terraform module deploys a Google Kubernetes Cluster on Google Cloud Platform (GCP). The mode of operation of GKE will be autopilot.

## Prerequisites

Before you begin, ensure you have the following:

1.  **GCP Project:** You need an active Google Cloud Platform project.
2.  **GCP Credentials:**  Ensure your environment is configured with GCP credentials that have the necessary permissions to create Vertex AI Index, Index Endpoint, Deploy Index, and Cloud Storage access to your existing bucket.
3.  **Terraform Installed:**  Make sure you have Terraform installed on your local machine. ( [https://www.terraform.io/downloads.html](https://www.terraform.io/downloads.html) )

## Files in this Module

*   **`main.tf`**: Contains the Terraform resource definitions for the Following.
    * IAM Custom Role: Creates a custom role. The custom role will have the permission to query Vector Search deployed index.
    * Service Account: Creates a service account which will be used by the nodes of GKE.
    * Container Cluster: Creates a GKE Cluster in Autopilot mode.
*   **`variables.tf`**: Defines all the configurable variables for this module with descriptions and default values.
*   **`terraform.tfvars`**: Used to assign values to the variables defined in `variables.tf`.
*   **`README.md`**: This file, providing detailed documentation for the Vertex AI Vector Search module.

## Configuration Variables

The following variables are defined in `variables.tf` and **must be set in your root `terraform.tfvars` file** when using this module.

| Variable Name                                   | Description                                                                                                                              | Type    | Default                      | Example                                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------- | --------------------------------------------------------------------------- |
| `project_id`                                    | GCP Project ID where resources will be deployed.                                                                                         | string  | **Required**                 | `your-gcp-project-id`                                                       |
| `region`                                        | GCP region for deploying Vertex AI resources (Index, Endpoint).                                                                          | string  | `"us-central1"`              | `"europe-west1"`                                                            |
| `project_number`                                | Numerical Google Cloud project number. Can be found by running `gcloud projects describe <project_id>` command.                          | number  | **Required**                 | `some-number`                                                               |
| `image`                                         | Load testing image name.                                                                         | string  | **Required**             | `"us-central1-docker.pkg.dev/email2podcast/ishmeetss-locust-docker-repo/locust-image:LTF"`                              |


## Getting Started

1.  **Clone this repository.**
2.  **Navigate to the root directory of the repository.**
3.  **Create or modify `terraform.tfvars` in the root directory.**  This file is where you set the values for all the variables listed above.
4.  **Initialize Terraform:** Run `terraform init` from the root directory.
5.  **Apply the Configuration:** Run `terraform apply` from the root directory. Review the plan and type `yes` to confirm.
6.  **To use `kubectl`:** Run `gcloud container clusters get-credentials ltf-autopilot-cluster --location us-central1` command.
7.  **Destroy Infrastructure (When done):** Run `terraform destroy` from the root directory when you want to remove the deployed resources.
