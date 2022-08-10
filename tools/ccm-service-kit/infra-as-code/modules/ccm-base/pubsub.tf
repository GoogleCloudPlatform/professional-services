resource "google_pubsub_topic" "ccm-trigger-pubsub" {
    project = var.project_id
    name = var.ccm-trigger-pubsub-topic
}

resource "google_pubsub_topic" "ccm-delete-pubsub" {
    project = var.project_id
    name = var.ccm-delete-pubsub-topic
}