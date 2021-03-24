module "dataflow_bigquery" {
  source         = "./modules/bigquery"
  project = var.project
  dataset_name = var.bq_dataset_name
}