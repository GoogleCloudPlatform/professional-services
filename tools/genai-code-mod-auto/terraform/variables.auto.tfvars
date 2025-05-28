code_trans_sa_roles = [
    "roles/secretmanager.secretAccessor",
    "roles/storage.objectUser",
    "roles/artifactregistry.createOnPushWriter",
    "roles/bigquery.jobUser",
    "roles/cloudbuild.builds.builder",
    "roles/logging.logWriter",
    "roles/appengine.appAdmin",
    "roles/storage.objectViewer",
    "roles/aiplatform.user"
]
required_apis = [
    "secretmanager.googleapis.com",
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "cloudfunctions.googleapis.com",
    "aiplatform.googleapis.com"
]


//Please change the following variables
//Project ID where resources will be created
project_id = "project_id"
//Location where resources will be created
location = "location"
//Staging Cloud function bucket where the source code will be stored
stg_cf_bucket = "staging-bucket" 
