variable "project_id" {
  type        = string
  description = "Default GCP project where all of your resources will be created in"
}

variable "cluster_name" {
  type        = string
  description = "The name of the cluster"
}

variable "cluster_location" {
  type        = string
  description = "The location (zone or region) this cluster has been created in. One of location, region, zone, or a provider-level zone must be specified."
}

variable "gitlab_agent" {
  type        = string
  description = "Name of gitlab KAS agent"
  default     = "gitlab-kas"
}

variable "gitlab_repo_name" {
  type        = string
  description = "Name of repository in Gitlab"
}

variable "product_name" {
  type        = string
  description = "Name of project/product by which to distinguish k8s resources"
}

variable "config_author_email" {
  type        = string
  description = "Author email to use for commits in gitlab repo"
  default     = ""
}

variable "config_author_name" {
  type        = string
  description = "Author name to use for commits in gitlab repo"
  default     = ""
}

variable "kas_address" {
  type        = string
  description = "Address of Gitlab Agent server for KAS clients"
  default     = "wss://kas.gitlab.com"
}

variable "agentk_image_url" {
  type        = string
  description = "Image URL of Gitlab agentk image hosted in a container registry"
  default     = "registry.gitlab.com/gitlab-org/cluster-integration/gitlab-agent/agentk"
}

variable "agentk_image_tag" {
  type        = string
  description = "Tag of agentk image"
  default     = "v15.9.0-rc1"
}

variable "gitlab_agent_chart_repo" {
  type        = string
  description = "Repository for gitlab Helm chart"
  default     = "https://charts.gitlab.io"
}

variable "gitlab_agent_chart_name" {
  type        = string
  description = "Name of gitlab agent chat in repository"
  default     = "gitlab-agent"
}