#
# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# CFv2 define whether to use Cloud function 2nd generation or 1st generation

import re
from distutils.command.config import config
import os
import time
from google.cloud import monitoring_v3, asset_v1
from google.protobuf import field_mask_pb2
from googleapiclient import discovery
from metrics import ilb_fwrules, firewall_policies, instances, networks, metrics, limits, peerings, routes, subnets, vpc_firewalls

CF_VERSION = os.environ.get("CF_VERSION")


def get_monitored_projects_list(config):
  '''
      Gets the projects to be monitored from the MONITORED_FOLDERS_LIST environment variable.

        Parameters:
          config (dict): The dict containing config like clients and limits
        Returns:
          monitored_projects (List of strings): Full list of projects to be monitored
      '''
  monitored_projects = config["monitored_projects"]
  monitored_folders = os.environ.get("MONITORED_FOLDERS_LIST").split(",")

  # Handling empty monitored folders list
  if monitored_folders == ['']:
    monitored_folders = []

  # Gets all projects under each monitored folder (and even in sub folders)
  for folder in monitored_folders:
    read_mask = field_mask_pb2.FieldMask()
    read_mask.FromJsonString('name,versionedResources')

    response = config["clients"]["asset_client"].search_all_resources(
        request={
            "scope": f"folders/{folder}",
            "asset_types": ["cloudresourcemanager.googleapis.com/Project"],
            "read_mask": read_mask
        })

    for resource in response:
      for versioned in resource.versioned_resources:
        for field_name, field_value in versioned.resource.items():
          if field_name == "projectId":
            project_id = field_value
            # Avoid duplicate
            if project_id not in monitored_projects:
              monitored_projects.append(project_id)

  print("List of projects to be monitored:")
  print(monitored_projects)

  return monitored_projects


def monitoring_interval():
  '''
    Creates the monitoring interval of 24 hours
      Returns:
        monitoring_v3.TimeInterval: Monitoring time interval of 24h
    '''
  now = time.time()
  seconds = int(now)
  nanos = int((now - seconds) * 10**9)
  return monitoring_v3.TimeInterval({
      "end_time": {
          "seconds": seconds,
          "nanos": nanos
      },
      "start_time": {
          "seconds": (seconds - 24 * 60 * 60),
          "nanos": nanos
      },
  })


config = {
    # Organization ID containing the projects to be monitored
    "organization":
        os.environ.get("ORGANIZATION_ID"),
    # list of projects from which function will get quotas information
    "monitored_projects":
        os.environ.get("MONITORED_PROJECTS_LIST").split(","),
    "monitoring_project":
        os.environ.get('MONITORING_PROJECT_ID'),
    "monitoring_project_link":
        f"projects/{os.environ.get('MONITORING_PROJECT_ID')}",
    "monitoring_interval":
        monitoring_interval(),
    "limit_names": {
        "GCE_INSTANCES":
            "compute.googleapis.com/quota/instances_per_vpc_network/limit",
        "L4":
            "compute.googleapis.com/quota/internal_lb_forwarding_rules_per_vpc_network/limit",
        "L7":
            "compute.googleapis.com/quota/internal_managed_forwarding_rules_per_vpc_network/limit",
        "SUBNET_RANGES":
            "compute.googleapis.com/quota/subnet_ranges_per_vpc_network/limit"
    },
    "lb_scheme": {
        "L7": "INTERNAL_MANAGED",
        "L4": "INTERNAL"
    },
    "clients": {
        "discovery_client": discovery.build('compute', 'v1'),
        "asset_client": asset_v1.AssetServiceClient(),
        "monitoring_client": monitoring_v3.MetricServiceClient()
    },
    # Improve performance for Asset Inventory queries on large environments
    "page_size":
        500,
    "series_buffer": [],
}


def main(event, context=None):
  '''
      Cloud Function Entry point, called by the scheduler.
        Parameters:
          event: Not used for now (Pubsub trigger)
          context: Not used for now (Pubsub trigger)
        Returns:
          'Function executed successfully'
    '''
  # Handling empty monitored projects list
  if config["monitored_projects"] == ['']:
    config["monitored_projects"] = []

  # Gets projects and folders to be monitored
  config["monitored_projects"] = get_monitored_projects_list(config)

  # Keep the monitoring interval up2date during each run
  config["monitoring_interval"] = monitoring_interval()

  metrics_dict, limits_dict = metrics.create_metrics(
      config["monitoring_project_link"], config)
  project_quotas_dict = limits.get_quota_project_limit(config)

  firewalls_dict = vpc_firewalls.get_firewalls_dict(config)
  firewall_policies_dict = firewall_policies.get_firewall_policies_dict(config)

  # IP utilization subnet level metrics
  subnets.get_subnets(config, metrics_dict)

  # Asset inventory queries
  gce_instance_dict = instances.get_gce_instance_dict(config)
  l4_forwarding_rules_dict = ilb_fwrules.get_forwarding_rules_dict(config, "L4")
  l7_forwarding_rules_dict = ilb_fwrules.get_forwarding_rules_dict(config, "L7")
  subnet_range_dict = networks.get_subnet_ranges_dict(config)
  static_routes_dict = routes.get_static_routes_dict(config)
  dynamic_routes_dict = routes.get_dynamic_routes(
      config, metrics_dict, limits_dict['dynamic_routes_per_network_limit'])

  try:

    # Per Project metrics
    vpc_firewalls.get_firewalls_data(config, metrics_dict, project_quotas_dict,
                                     firewalls_dict)
    # Per Firewall Policy metrics
    firewall_policies.get_firewal_policies_data(config, metrics_dict,
                                                firewall_policies_dict)
    # Per Network metrics
    instances.get_gce_instances_data(config, metrics_dict, gce_instance_dict,
                                     limits_dict['number_of_instances_limit'])
    ilb_fwrules.get_forwarding_rules_data(
        config, metrics_dict, l4_forwarding_rules_dict,
        limits_dict['internal_forwarding_rules_l4_limit'], "L4")
    ilb_fwrules.get_forwarding_rules_data(
        config, metrics_dict, l7_forwarding_rules_dict,
        limits_dict['internal_forwarding_rules_l7_limit'], "L7")

    routes.get_static_routes_data(config, metrics_dict, static_routes_dict,
                                  project_quotas_dict)

    peerings.get_vpc_peering_data(config, metrics_dict,
                                  limits_dict['number_of_vpc_peerings_limit'])

    # Per VPC peering group metrics
    metrics.get_pgg_data(
        config,
        metrics_dict["metrics_per_peering_group"]["instance_per_peering_group"],
        gce_instance_dict, config["limit_names"]["GCE_INSTANCES"],
        limits_dict['number_of_instances_ppg_limit'])
    metrics.get_pgg_data(
        config, metrics_dict["metrics_per_peering_group"]
        ["l4_forwarding_rules_per_peering_group"], l4_forwarding_rules_dict,
        config["limit_names"]["L4"],
        limits_dict['internal_forwarding_rules_l4_ppg_limit'])
    metrics.get_pgg_data(
        config, metrics_dict["metrics_per_peering_group"]
        ["l7_forwarding_rules_per_peering_group"], l7_forwarding_rules_dict,
        config["limit_names"]["L7"],
        limits_dict['internal_forwarding_rules_l7_ppg_limit'])
    metrics.get_pgg_data(
        config, metrics_dict["metrics_per_peering_group"]
        ["subnet_ranges_per_peering_group"], subnet_range_dict,
        config["limit_names"]["SUBNET_RANGES"],
        limits_dict['number_of_subnet_IP_ranges_ppg_limit'])
    #static
    routes.get_routes_ppg(
        config, metrics_dict["metrics_per_peering_group"]
        ["static_routes_per_peering_group"], static_routes_dict,
        limits_dict['static_routes_per_peering_group_limit'])
    #dynamic
    routes.get_routes_ppg(
        config, metrics_dict["metrics_per_peering_group"]
        ["dynamic_routes_per_peering_group"], dynamic_routes_dict,
        limits_dict['dynamic_routes_per_peering_group_limit'])
  except Exception as e:
    print("Error writing metrics")
    print(e)
  finally:
    metrics.flush_series_buffer(config)

  return 'Function execution completed'


if CF_VERSION == "V2":
  import functions_framework
  main_http = functions_framework.http(main)

if __name__ == "__main__":
  main(None, None)