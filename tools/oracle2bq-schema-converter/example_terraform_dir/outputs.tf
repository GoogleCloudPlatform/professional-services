/**
 * Copyright 2020 Google LLC. 
 *
 * This software is provided as-is, 
 * without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google. 
 */

output "bigquery_dataset" {
  value       = module.hr-dataset.bigquery_dataset
  description = "Bigquery dataset resource."
}

output "bigquery_tables" {
  value       = module.hr-dataset.bigquery_tables
  description = "Map of bigquery table resources being provisioned."
}
