# Getting started

Copy the `deploy_cloud_run.yaml` file into your application's git repository.
Modify the substitution default values as needed.

# Using the Terraform Example:

This Terraform is an example Cloud Build Triggers and some example dependencies
that allows you to deploy the latests version of your application to Cloud Run.

Instead of using this as-is, you will want to copy a version of this into your
existing terraform configurations for your CICD pipelines and applications.

## Terraform Variables

| Name                | Description                                                     | Type     |
| ------------------- | --------------------------------------------------------------- | -------- |
| project_id          | The ID of the GCP Project to deply the Cloud Build Triggers to. | `string` |
| cicd_project_id     | The name of the CICD Project to connect to GCR AR Topic.        | `string` |
| region              | The root region to deploy the application to.                   | `string` |
| production          | Production Environment (Hide API Swaggers).                     | `bool`   |
| cicd_ar_docker_name | CICD Project Artifact Registry Docker Repo Name.                | `string` |
| cicd_ar_docker_loc  | CICD Project Artifact Registry Docker Repo Location.            | `string` |
| application_name    | The name of the application to deploy.                          | `string` |
