project_id = "example-monitoring-prod-318511"
nfs-volumes = {
  "vol-1" = {
    protocol_types     = ["NFSv3"]
    size               = 1024 # Can't be smaller than 100 GB
    enabled_snap       = true
    replication        = false
    snapshot_directory = true
    snapshot_policy = {
      enabled = false
    }
    export_policy = {
      rule01 = {
        allowed_clients = "172.16.2.0/24"
        access          = "ReadWrite"
      }
    }
  }
  "vol-2" = {
    protocol_types     = ["NFSv3"]
    size               = 1024 # Can't be smaller than 100 GB
    enabled_snap       = false
    replication        = false
    snapshot_directory = true
    snapshot_policy = {
      enabled                   = true
      daily_snapshot            = true
      hourly_snapshot           = false
      monthly_snapshot          = true
      weekly_snapshot           = true
      monthly_hour              = 0
      monthly_minute            = 0
      monthly_snapshots_to_keep = 0
      days_of_month             = "1"
      daily_hour                = 15
      daily_minute              = 00
      daily_snapshots_to_keep   = 7
      weekly_hour               = 0
      weekly_minute             = 0
      weekly_snapshots_to_keep  = 0
      day                       = "Sunday"
    }
    export_policy = {
      rule01 = {
        allowed_clients = "172.16.2.0/24"
        access          = "ReadWrite"
      }
    }
  }
}