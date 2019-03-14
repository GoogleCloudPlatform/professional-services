# This code is a prototype and not engineered for production use.
# Error handling is incomplete or inappropriate for usage beyond
# a development sample.

variable "topic" {
  type = "string"
}

variable "project" {
  type = "string"
}
variable "domain" {
  type = "string"
}

variable "repo" {
  type = "string"
}

variable "branch" {
  type = "string"
}

variable "region" {
  type = "string"
}

variable "function" {
  type = "string"
}

variable "entry_point" {
  type = "string"
}

data "google_organization" "org" {
  domain = "${var.domain}"
}

data "google_project" "bqn_project" {
  project_id = "${var.project}"
}

resource "google_pubsub_topic" "org_wide_jobcomplete" {
  name = "${var.topic}"
  project = "${var.project}"
}

resource "google_logging_organization_sink" "jobcomplete_sink" {
  name = "jobcomplete-sink"
  org_id = "${data.google_organization.org.id}"
  destination = "pubsub.googleapis.com/projects/${var.project}/topics/${var.topic}"
  filter = "resource.type=\"bigquery_resource\" protoPayload.serviceName=\"bigquery.googleapis.com\" protoPayload.methodName=\"jobservice.jobcompleted\""
  include_children = true
}

resource "google_project_iam_binding" "log_publisher" {
  role = "roles/pubsub.publisher"
  project = "${var.project}"
  members = [
    "${google_logging_organization_sink.jobcomplete_sink.writer_identity}",
  ]
}

resource "google_project_service" "source_repo_api" {
  project = "${var.project}"
  service = "sourcerepo.googleapis.com"
}

resource "google_sourcerepo_repository" "function_repo" {
  name = "${var.repo}"
  project = "${var.project}"
  provisioner "local-exec" {
    command = "bash configure_repo.sh ${var.repo} ${var.project} ${var.branch}"
  }
  depends_on = ["google_project_service.source_repo_api"]
}

resource "google_project_service" "cloud_functions_api" {
  project = "${var.project}"
  service = "cloudfunctions.googleapis.com"
}

resource "google_project_service" "cloud_builder_api" {
  project = "${var.project}"
  service = "cloudbuild.googleapis.com"
}

resource "google_project_iam_binding" "cloud_builder_function_developer" {
  role = "roles/cloudfunctions.developer"
  project = "${var.project}"
  members = [
    "serviceAccount:${data.google_project.bqn_project.number}@cloudbuild.gserviceaccount.com"
  ]
}

resource "google_service_account_iam_member" "cloud_builder_runtime_binding" {
  service_account_id = "projects/${var.project}/serviceAccounts/${var.project}@appspot.gserviceaccount.com"
  role = "roles/iam.serviceAccountUser"
  member = "serviceAccount:${data.google_project.bqn_project.number}@cloudbuild.gserviceaccount.com"
}

resource "google_cloudfunctions_function" "bq_notifier" {
  name = "${var.function}"
  project = "${var.project}"
  entry_point = "${var.entry_point}"
  region = "${var.region}"
  description = "Acts on BQ Job Complete events to Notify based on labels"
  runtime = "go111"
  source_repository {
    url = "https://source.developers.google.com/projects/${var.project}/repos/${google_sourcerepo_repository.function_repo.name}/moveable-aliases/${var.branch}/paths/"
  }
  event_trigger {
    event_type = "providers/cloud.pubsub/eventTypes/topic.publish"
    resource = "${google_pubsub_topic.org_wide_jobcomplete.name}"
    failure_policy {
      retry = false
    }
  }
  depends_on = ["google_project_service.cf_api"]
}

resource "google_cloudbuild_trigger" "bq_notifier_repo_trigger" {
  trigger_template {
    branch_name = "${var.branch}"
    repo_name = "${google_sourcerepo_repository.function_repo.name}"
  }
  build {
    step {
      name = "gcr.io/cloud-builders/gcloud"
      args = [
        "functions",
        "deploy",
        "${google_cloudfunctions_function.bq_notifier.name}",
        "--source",
        "https://source.developers.google.com/projects/${var.project}/repos/${google_sourcerepo_repository.function_repo.name}/moveable-aliases/${var.branch}/paths/",
      ]
    }
  }
}
