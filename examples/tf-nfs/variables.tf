variable "project_id" {
  description = "The GCP project you want to manage"
  type        = string
}

variable "environment" {
  description = "The GCP environment"
  type        = string
}

variable "nfs-volumes" {
  description = "NFS Volumes to create."
  type        = any
  default     = {}
}


# variable "nfs-volumes" {
#   type = map(object({
#     app_component  = string
#     region         = string
#     protocol_types = list(string)
#     network        = string
#     size           = number
#     service_level  = string
#     enabled_snap   = bool
#     # snap_hour      = number
#     snapshot_policy = map (any)
#     export_policy  = map(any)
#   }))
# }