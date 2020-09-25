provider "google" {
  version     = "~> 3.19.0"
  # Update credentials to the correct location, alternatively set   GOOGLE_APPLICATION_CREDENTIALS=/path/to/.ssh/bq-key.json in your shell session and   remove the credentials attribute.
  credentials = file("/Users/joe/.ssh/bq-key.json") 
}


module "hr-dataset" {
  source                      = "terraform-google-modules/bigquery/google"
  version                     = "~> 4.0"
  dataset_id                  = "HR"
  dataset_name                = "HR"
  description                 = "HR dataset copied from the end tables of Oracle datawarehouse"
  default_table_expiration_ms = var.default_table_expiration_ms
  project_id                  = var.project_id
  location                    = "EU"
  tables                      = var.tables
  dataset_labels              = var.dataset_labels
}