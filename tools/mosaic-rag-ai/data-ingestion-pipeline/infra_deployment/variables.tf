variable "gcp_project_id" {
  description = "The GCP project ID to deploy the resources to."
  type        = string
  default = "agents-stg"
}

variable "region" {
  description = "The GCP region to deploy the resources in."
  type        = string
  default     = "us-central1"
}

variable "gemini_api_key" {
  description = "gemini api key as environment variable"
  type        = string
}

variable "gemini_model" {
  description = "gemini model as environment variable"
  type        = string
}

variable "corpus_display_name"{
  description = "RAG Corpus display name"
  type = string
  default = "mosaic-rag-corpus"
}

variable "corpus_path" {
  description = "The Path of the RAG Corpus created by the rag deployment step."
  type        = string
}