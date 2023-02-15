variable "featurestore" {
  description = "A list of featurestores to be created"
  type = map(object({
    name = string
    labels = map(string)
    region = string
    online_serving_config = object({
        fixed_node_count = number
    })
    entities = list(object({
      name = string
      labels = map(string)
      monitoring_config = object({
        snapshot_analysis = object({
          disabled = bool
          monitoring_interval = string
        })
      })
      features = list(object({
        name = string
        labels = map(string)
        value_type = string
      }))
    }))
  }))
}

variable "project" {
  description = "The ID of the project in which the resource belongs."
  type        = string
}