resource "google_cloud_scheduler_job" "composer-scheduler-job" {
    project = var.project_id
    region = var.region
    name        = var.ccm-scheduler-trigger-name
    description = "trigger used to create composer instance"
    schedule    = var.ccm-scheduler-trigger-frecuency

    pubsub_target {
        # topic.id is the topic's full resource name.
        topic_name = google_pubsub_topic.ccm-trigger-pubsub.id
        data       = base64encode("test")
    }
}