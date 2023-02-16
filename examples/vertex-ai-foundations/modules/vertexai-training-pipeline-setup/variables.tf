variable "project_id" {
  description = "Project ID"

}

variable "service_accounts" {
  description = "Service accounts to be created, and roles assigned them on the project, service accounts and storage."
  type        = map(object({
    project_roles = optional(list(string))
    sa_roles      = optional(map(list(string)))
    storage_roles = optional(map(list(string)))
  }))
  default     = {}
}

variable "bucket" {
  description = "Bucket to be created to store artifacts for Training pipeline"
  type        = object({
    name           = string
    prefix         = string
    iam            = map(list(string))
    encryption_key = optional(string)
  })
  
}