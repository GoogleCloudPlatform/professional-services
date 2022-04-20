terraform {
 backend "gcs" {
   bucket  = "<unique-bucket-to-store-terraform-state>"
   prefix  = "dbt-on-cloud-composer/state"
 }
}
