resource "google_storage_bucket" "history-bucket"{
    "name" =    "${var.history-bucket}"
    "storage_class" = "REGIONAL"
    "location" =  "${var.history-region}"
}
