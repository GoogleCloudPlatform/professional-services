This is a collection of Cloud Build Examples for common CICD Tasks to be used
for applications where their repository is connected to Google Cloud Build.

These `.yaml` examples can be copied to the root directory of applications where
their traditional Dockerfiles are or you can choose to add them to a
`cloudbuild/`, `.cloudbuild/`, or `.ci/` directory.

Each example has a terraform Cloud Build Trigger Example to be used for any IAC
Setup.

## Containerize:

This Example allows you to containerize an application and push to a specific
Artifact Registry Docker repository. Cloud Build will containerize the
application based on the `Dockerfile` defined within the repository used.

## Deploy to Cloud Run

This example allows you to deploy your application to Cloud Run when a new
container image is pushed to Artifact Registry.

This trigger is dependant on the Containerization Cloud Build triggers of the
application. After a Containerization trigger completes, it should push the new
container image as `latest` to Artifact Registry within the project. This
makes uses of the `gcr`
[pubsub Topic](https://cloud.google.com/artifact-registry/docs/configure-notifications#overview)
Setup or create the gcr topic either manually or with the below terraform code:

```
# Create Pupsub Topic that captures Artifact Registry Events.
# https://cloud.google.com/artifact-registry/docs/configure-notifications#overview
resource "google_pubsub_topic" "cicd_ar_image_pub" {
  project = var.project_cicd
  name    = "gcr"
}
```

Since the Containerization build is done within cloud build, then this Cloud
Build Trigger will be able to pick up that message using the filter provided.

Once the pub/sub message is received for the application's image
containerization, then this trigger will kick off a Cloud Run Deployment.
