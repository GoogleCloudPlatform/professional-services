# Set up BQ Dataset
resource "google_bigquery_dataset" "bq_demo_dataset" {
  project    = var.project
  dataset_id = var.dataset_name
  location   = var.dataset_location
}

resource "google_bigquery_table" "bq_demo_tables" {
  for_each   = fileset(var.bq_path_to_schemas, "*.json")
  project    = var.project
  dataset_id = google_bigquery_dataset.bq_demo_dataset.dataset_id
  table_id   = split(".", each.key)[0]
  schema     = file("${path.root}/${var.bq_path_to_schemas}/${each.key}")
}