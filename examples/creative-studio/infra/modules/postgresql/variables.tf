variable "project_id" {}
variable "region" {}
variable "db_name" { default = "creative_studio" }
variable "db_user" { default = "studio_user" }
variable "db_password" { sensitive = true }
