variable project {
  description = "Project name"
  type        = "string"
  default     = ""
}

variable name {
  description = "Service name you are running"
  type        = "string"
  default     = ""
}

variable instance_groups {
  description = "Instance groups and zones (colon separated)"
  type        = "list"
  default     = []
}

variable details {
  description = "Proxy and Health details for your service"
  type        = "map"
  default     = {
    name           = "" # unique port name per service
    port           = "" # NodePort of your service
    health_path    = "" # HealthCheck path
    timeout        = "" # HealthCheck timeout
    public_port    = "" # GLB port
  }
}

variable backends {
  description = "Instance Groups to add to the backend"
  type        = "list"
  default     = [
    {group = ""}]
}

variable certificates {
  description = "List of cert self_links"
  type        = "list"
  default     = []
}