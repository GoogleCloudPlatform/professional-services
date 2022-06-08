project_id  = "example-monitoring-prod-318511"
environment = "qal"
nfs-volumes = {
  "fcs" = {
    app_component  = "main"
    region         = "us-west2"
    protocol_types = ["NFSv3"]
    network        = "custom-vpc-1"
    size           = 1024 # Can't be smaller than 100 GB
    service_level  = "premium"
    enabled_snap   = true
    snapshot_policy = {
      enabled           = true
      daily_snapshot    = false
      monthly_snapshot  = true
      weekly_snapshot   = false
      #hour              = 1
      snapshots_to_keep = 7
    }
    export_policy = {
      rule01 = {
        allowed_clients = "172.16.2.0/24"
        access          = "ReadWrite"
      }
    }
  }
  "crx" = {
    app_component  = "main"
    region         = "us-west2"
    protocol_types = ["NFSv3"]
    network        = "custom-vpc-1"
    size           = 1024 # Can't be smaller than 100 GB
    service_level  = "premium"
    enabled_snap   = false
    snapshot_policy = {
      enabled          = false
      monthly_snapshot = false
      daily_snapshot   = false
      weekly_snapshot  = false
    }
    export_policy = {
      rule01 = {
        allowed_clients = "172.16.2.0/24"
        access          = "ReadWrite"
      }
    }
  }
}