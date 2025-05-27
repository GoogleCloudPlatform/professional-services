#The following terraform creates the necessary infraestructure needed to create Cloud functions 

resource "google_project_service" "apis" {
  for_each = toset(var.required_apis)
  project  = var.project_id
  service = each.value  
}

#Service account creation
resource "google_service_account" "code_trans_sa" {
    depends_on = [ google_project_service.apis ]
    project = var.project_id
    account_id   = "code-translator-sa"
    display_name = "Code Translator SA"
    description = "Service account used to build the Code Translator Cloud Function and execute the code for it"
}

#Roles grant
resource "google_project_iam_member" "code_trans_sa_roles" {
  depends_on = [ google_service_account.code_trans_sa ]
  for_each = toset(var.code_trans_sa_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.code_trans_sa.email}"
}

#Bucket for Cloud function's code
resource "google_storage_bucket" "code_trans_stg_bucket" {
    project = var.project_id
    name     = var.stg_cf_bucket
    location = var.location
    uniform_bucket_level_access = true
}

# Zip files with code 
resource "archive_file" "code_trans_source_code_zip" {
  type        = "zip"
  source_dir  = "../src_code/" # Source Code
  output_path = "../src_code/code_trans_source_code.zip" # Zip output
}

# Source Code Storage
resource "google_storage_bucket_object" "code_trans_source_code_zip" {
  depends_on = [ google_storage_bucket.code_trans_stg_bucket ]
  name   = "code_trans_source_code.zip"
  bucket = google_storage_bucket.code_trans_stg_bucket.name
  source = "../src_code/code_trans_source_code.zip"
}

resource "time_sleep" "wait_for_propagation" {
  depends_on = [ google_project_service.apis, google_project_iam_member.code_trans_sa_roles ]
  create_duration = "60s"
}

#Cloud Function Second Generation (Latest)

# code_trans function
resource "google_cloudfunctions2_function" "code_trans_function" {
  depends_on = [google_project_service.apis, google_project_iam_member.code_trans_sa_roles, time_sleep.wait_for_propagation , google_storage_bucket_object.code_trans_source_code_zip ]
  project = var.project_id
  name = "code_trans"
  description = "Cloud Function for Code Translator"
  location = var.location

  build_config {
    runtime = "python312"
    entry_point = "main"  # Set the entry point 
    service_account = "projects/${var.project_id}/serviceAccounts/${google_service_account.code_trans_sa.email}"
    source {
      storage_source {
        bucket = google_storage_bucket.code_trans_stg_bucket.name
        object = google_storage_bucket_object.code_trans_source_code_zip.name
      }
    }
  }

  service_config {
    max_instance_count  = 1
    available_memory    = "512M"
    timeout_seconds     = 3600
    service_account_email = google_service_account.code_trans_sa.email
    ingress_settings = "ALLOW_ALL"
    environment_variables = {
        #Enter the project id where the secrets are stored
        PROJECT_ID = "${var.project_id}",
        LOCATION="${var.location}",
    }
  }
}


