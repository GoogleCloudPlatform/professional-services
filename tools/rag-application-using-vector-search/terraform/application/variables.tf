
variable "corpus_name" {
  type        = string
  description = "Name of the RAG Corpus"
}

variable "rag_engine_service_account" {
  type        = string
  description = "Name of the service account used by the RAG Engine"
}

variable "project_id" {
  type        = string
  description = "The ID of the Google Cloud project where resources will be created."
}

variable "project_number" {
  type        = string
  description = "Project number of the Google Cloud project."
}

variable "region" {
  type        = string
  description = "The Google Cloud region where resources will be created."
}

variable "deployment_id" {
  type        = string
  description = "Unique identifier for this deployment"
}