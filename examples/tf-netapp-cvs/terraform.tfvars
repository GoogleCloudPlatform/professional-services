# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

project_id = "project-id"
apis       = ["cloudvolumesgcp-api.netapp.com", "serviceusage.googleapis.com"]
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