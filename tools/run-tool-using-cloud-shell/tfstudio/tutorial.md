# TF Studio

## Setup

Welcome to TF Studio in Google Cloud Shell! 

TF Studio provides a diagrammatic interface for the users to draw required architectures with option to directly deploy from the same canvas. It also comes with prebuilt common architectures that can be directly reused or modified for a customized use-case.

## SDF Setup Steps!

Let's use {{project-id}} with TFStudio! Click the Cloud Shell icon below to copy the command
to your shell, update the {{project-id}}, and then run it from the shell by pressing Enter/Return. 

```bash
export GOOGLE_CLOUD_PROJECT={{project-id}}
```

To lunch the TFStudio run the below command.

```bash
docker run \
 -d \
 -p 8080:9000 \
 -e GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT \
gcr.io/new-project-340206/github.com/stenalpjolly/terraformstudio:latest
```

Let's open TFStudio page. Run the following to get web preview URL and click on the output URL to open SDF.

```bash
cloudshell get-web-preview-url -p 8080
```

