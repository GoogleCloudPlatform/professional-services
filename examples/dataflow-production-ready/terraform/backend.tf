terraform {
  backend "gcs" {
    bucket = "dataflow-pipeline-tf-backend"
    prefix = "state"
  }
}
