variable "tag" {
  description = "Example tag for Pubsub queue"
}

variable "name" {
  description = "PubSub queue name"
}

variable "project_id" {
  description = "project id"
}

variable "gcp_region" {
  description = "gcp region"
  default = "australia-southeast1"
}
