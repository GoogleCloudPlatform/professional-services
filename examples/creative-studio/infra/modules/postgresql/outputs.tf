output "connection_name" {
  value = google_sql_database_instance.default.connection_name
}
output "db_name" {
  value = google_sql_database.default.name
}
output "db_user" {
  value = google_sql_user.default.name
}
