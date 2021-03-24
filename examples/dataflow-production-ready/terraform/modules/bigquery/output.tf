output "project_name" {
  value = google_bigquery_dataset.bq_demo_dataset.project
}

output "bq_demo_dataset" {
  value = google_bigquery_dataset.bq_demo_dataset.dataset_id
}

