variable "org_id" {
  type = string
  description = "Numeric organization ID"
}
variable "project_id" {
  type = string
  description = "Project ID to deploy Function into"
}
variable "region" {
  type = string
  description = "Region for deploying Function"
}
variable "zone" {
  type = string
}
variable "feed_id" {
  type        = string
  description = "Name of the Asset Inventory Feed"
  default     = "org_ai_feed_firewall"
}
variable "function_sa_name" {
  type        = string
  description = "Name of the service account the Cloud Function runs as"
}
