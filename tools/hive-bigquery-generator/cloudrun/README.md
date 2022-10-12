# Cloud Run Deployment

This deployment mode enables you to build the app and push the docker image 
to artifact registry repo via cloud build and also optionally creates a cron 
using cloud scheduler 

Prerequisites 
1) Install gcloud 
2) Enable Cloud Build, Cloud Run, Cloud Scheduler, Artifact Registry Apis [Ref](https://cloud.google.com/endpoints/docs/openapi/enable-api#enabling_an_api) 
   - Enable Cloud Build and Artifact Registry API: [Ref](https://cloud.google.com/build/docs/build-push-docker-image#before-you-begin)
   - Enable Cloud Run API
   - Enable Cloud Scheduler API

3) Create Docker Artifact Registry Repo 
   - Refer to script : create_artifact_registry.sh for steps
   - [Public Doc](https://cloud.google.com/artifact-registry/docs/docker/store-docker-container-images)
   
4) Create service account with :
   - Cloud run permissions: [Ref](https://cloud.google.com/run/docs/create-jobs#permissions_required_to_create_and_execute)
   - Cloud Scheduler permissions: [Ref](https://cloud.google.com/scheduler/docs/http-target-auth#set_up_the_service_account)
   - Bigquery permissions 
     - BigQuery Data Owner (roles/bigquery.dataOwner) [ At project Level ]
     - BigQuery Job User (roles/bigquery.jobUser)  [ At project Level ]
     - Storage Object Viewer (roles/storage.objectViewer)  [ For GCS buckets on which hive tables are created ]
   - Access to the Hive Metastore 

Referecenes: 
- For using Service Account Cross Project. Ensure [this](https://cloud.google.com/run/docs/deploying#other-registries) doc is followed 
- If you are storing container images in an unsupported public or private container registry, you can temporarily push them to Artifact Registry using docker push in order to deploy them to Cloud Run
