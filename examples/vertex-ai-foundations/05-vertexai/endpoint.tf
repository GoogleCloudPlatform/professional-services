# Docs: https://registry.terraform.io/providers/hashicorp/google-beta/latest/docs/resources/vertex_ai_endpoint

resource "random_id" "endpoint_id" {
  byte_length = 4
}

resource "google_vertex_ai_endpoint" "endpoint" {
  provider     = google-beta
  name         = substr(random_id.endpoint_id.dec, 0, 10)
  display_name = "sample-endpoint"
  description  = "A sample vertex endpoint"
  location     = "us-central1"
  labels       = {
    label-one = "value-one"
  }
}