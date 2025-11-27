variable "project_id" {
    type = string
    description = "Project Id of the project where the resources will be created."
}

variable "code_trans_sa_roles" {
  description = "The list of IAM roles to assign to the service account for the cloud functions"
  type        = list(string)
}

variable "location" {
  description = "Location where the results will be created"
  type = string 
}

variable "required_apis" {
  type = list(string)
  description = "List of the required apis for the resources"
  
}

variable "stg_cf_bucket" {
  type = string
  description = "Name for the bucket where the source code for the cloud function will be stored"
  
}