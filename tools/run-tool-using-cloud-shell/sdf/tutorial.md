# Smart Deployment Framework

## Setup

Welcome to Smart Deployment Framework in Google Cloud Shell! 

The Smart Deployment Framework provides automated deployment of most commonly used reference architectures across different GCP workloads with an ability to download and share terraform code. The reference architectures includes combination of multiple GCP services combined together to address a business use-case.

## SDF Setup Steps!

Let's do Sanity check. Click the Cloud Shell icon below to copy the command
to your shell to get list of the organizations, and then run it from the shell by pressing Enter/Return.

```bash
gcloud organizations list
```

To lunch the SDF run the below command.

```bash
gsutil cp gs://atc-artifacts/SDF/docker-compose.yaml ./; sudo docker-compose up -d
```

Let's open SDF page. Run the following to get web preview URL and click on the output URL to open SDF.

```bash
cloudshell get-web-preview-url -p 8080
```

