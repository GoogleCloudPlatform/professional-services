# Universal Application Containerizer with Push to Artifact Registry

This Example allows you to containerize an application and push to a specific
Artifact Registry Docker Repository. Cloud build will containerize the
application based on the `Dockerfile` defined within the repository used.

Two image tags will be created.

1. The `latest` tag.
2. The SHORT_SHA tag. This is the shortform of the commit ID. This will be the long term tag on a specific image version.

## Getting started

Copy the `containerize.yaml` file into your application's git repository.
Modify the substitution default values as needed.

## Using the Terraform Example:

This Terraform is an example Cloud Build Trigger that allows you to containerize
the latests version of your application and then push the new image to Artifact
Registry.

Instead of using this as-is, you will want to copy a version of this into your
existing terraform configurations for your CICD pipelines and applications.

## Terraform Variables

| Name                | Description                                                            | Type     |
| ------------------- | ---------------------------------------------------------------------- | -------- |
| cicd_project_id     | The name of the CICD GCP Project to deply the Cloud Build Triggers to. | `string` |
| region              | The root region to deploy the Cloud Build Triggers to.                 | `string` |
| cicd_ar_docker_name | CICD Project Artifact Registry Docker Repo Name.                       | `string` |
| cicd_ar_docker_loc  | CICD Project Artifact Registry Docker Repo Location.                   | `string` |
| application_name    | The name of the application to containerize.                           | `string` |
