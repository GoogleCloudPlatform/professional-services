# Hybrid DLP example for MongoDB

This is an example of a Cloud Function which scans data stored in MongoDB in near real-time. To achieve 
that, it uses MongoDB [Change Streams](https://www.mongodb.com/docs/manual/changeStreams/) to read changes
to configured MongoDB collections and then submits those into the Google Cloud DLP API using Hybrid 
Inspection. 

The Cloud Functions runs for 10 minutes (or a configurable period), reads changes and submits them to
the DLP API. After 10 minutes (or a configurable amount), when the Cloud Function terminates, it stores 
a resume token into Cloud Storage. Upon restart, this token is then used to resume scanning. The code 
also caches any inspections (sans document IDs), so during the window that the function runs, same data 
isn't inspected twice.

## Deploying via Terraform

There is a full example of deploying a simple M0 shared instance on MongoDB Atlas, alongside with
the necessary resources to feed DLP findings into a Pub/Sub topic. 

To deploy the solution, create a `terraform.tfvars` file with contents similar:

```hcl
project_id               = "my-cloud-project-id"
region                   = "europe-west4"
scheduler_region         = "europe-west1"
mongodbatlas_public_key  = "from-atlas-console"
mongodbatlas_private_key = "from-atlas-console"
mongodbatlas_project_id  = "674d3f5767452c93b9bca7bf9" // visible in Atlas console URL
vpc_config               = {
  network    = "dlp-test"
  subnetwork = "dlp-test-euw4"
}
```

Then run `terraform init` and `terraform apply`.

## Configuration

The Cloud Function is configurable via environment variables:

- `MONGO_CONNECTION_STRING`: database connection details (eg. `mongodb+srv://host`)
- `MONGO_USERNAME` (optional): username used for connection
- `MONGO_PASSWORD` (optional): password used for connection
- `MONGO_DEPLOYMENTS` (optional): deployments to monitor (eg. entire installations, specify really anything here)
- `MONGO_DATABASES` (optional): databases to monitor (separate multiple ones with comma)
- `MONGO_COLLECTIONS` (optional): collections to monitor (specify as `database.collection`) (separate multiple ones with comma)
- `DLP_TRIGGER_NAME`: DLP trigger job name (eg. `projects/my-project-id/jobTriggers/1234567890`)
- `DLP_ENDPOINT`: DLP endpoint if using regional endpoints
- `PROJECT_ID`: Google Cloud project ID which is used for billing (usually the current project)
- `STATE_FILE`: bucket and object to store the state between invocations (eg. `gs://bucket/state.json`)
- `RUN_PERIOD`: how long to run the function (defaults to `10m`, use `time.ParseDuration` specs)

## MongoBD Atlas permissions

The following project permissions are required to create the necessary plumbing:

- Project Owner

Note that creation of Atlas private link resources can take a long time (20-30 minutes).

