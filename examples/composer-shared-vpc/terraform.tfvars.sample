org_id                    = ""
prefix                    = ""
terraform_service_account = ""
billing_account           = ""
folder_name               = ""
composer_subnets = {
  subnet-composer1-private-us-ea4 = {
    description    = "This is a subnet for composer1 private env"
    cidr_range     = "10.44.42.0/24"
    region         = "us-east4"
    private_access = true
    flow_logs      = true
    secondary_ranges = [
      {
        range_name    = "pods-composer1-us-ea4"
        ip_cidr_range = "10.45.0.0/22"
      },
      {
        range_name    = "svcs-composer1-us-ea4"
        ip_cidr_range = "10.46.43.0/24"
    }]
  }
}

composer_v1_private_envs = {
  composer-test-env = {
    region                = "us-east4"
    zone                  = "us-east4-a"
    pod_ip_range_name     = "pods-composer1-us-ea4"
    service_ip_range_name = "svcs-composer1-us-ea4"
    subnet                = "subnet-composer1-private-us-ea4"
    control_plane_cidr    = "172.18.1.0/24"
    web_server_cidr       = "172.18.0.16/28"
    cloud_sql_cidr        = "172.18.1.0/24"
    tags                  = ["composer-worker"]
  }
}
