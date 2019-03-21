moduke "vpc" {
  source  = "terraform-google-modules/network/google"
  version = "0.6.0"

  project_id   = "${var.project}"
  name         = "${var.network}"
  routing_mode = "REGIONAL"

  subnets = [
    {
      subnet_name           = "${var.hadoop-subnet}"
      subnet_ip             = "${var.hadoop-cidr-range}"
      subnet_region         = "${var.history-region}"
      subnet_private_access = "true"
      subnet_flow_logs      = "true"
    },
  ]
}
