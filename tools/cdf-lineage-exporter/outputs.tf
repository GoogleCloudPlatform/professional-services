output "lineage_http_trigger_endpoint" {
  value = google_cloudfunctions_function.cdap_lineage_export.https_trigger_url
}
