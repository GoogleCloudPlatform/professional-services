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
#

import time

from code import interact
from collections import defaultdict
from . import metrics, networks, limits


def get_gce_instance_dict(config: dict):
  '''
  Calls the Asset Inventory API to get all GCE instances under the GCP organization.

    Parameters:
      config (dict): The dict containing config like clients and limits

    Returns:
      gce_instance_dict (dictionary of string: int): Keys are the network links and values are the number of GCE Instances per network.
  '''

  gce_instance_dict = defaultdict(int)

  response = config["clients"]["asset_client"].search_all_resources(
      request={
          "scope": f"organizations/{config['organization']}",
          "asset_types": ["compute.googleapis.com/Instance"],
          "page_size": config["page_size"],
      })
  for resource in response:
    for field_name, field_value in resource.additional_attributes.items():
      if field_name == "networkInterfaceNetworks":
        for network in field_value:
          if network in gce_instance_dict:
            gce_instance_dict[network] += 1
          else:
            gce_instance_dict[network] = 1

  return gce_instance_dict


def get_gce_instances_data(config, metrics_dict, gce_instance_dict, limit_dict):
  '''
    Gets the data for GCE instances per VPC Network and writes it to the metric defined in instance_metric.

      Parameters:
        config (dict): The dict containing config like clients and limits
        metrics_dict (dictionary of dictionary of string: string): metrics names and descriptions
        gce_instance_dict (dictionary of string: int): Keys are the network links and values are the number of GCE Instances per network.
        limit_dict (dictionary of string:int): Dictionary with the network link as key and the limit as value
      Returns:
        gce_instance_dict
  '''
  timestamp = time.time()
  for project_id in config["monitored_projects"]:
    network_dict = networks.get_networks(config, project_id)

    current_quota_limit = limits.get_quota_current_limit(
        config, f"projects/{project_id}",
        config["limit_names"]["GCE_INSTANCES"])
    if current_quota_limit is None:
      print(
          f"Could not determine number of instances for projects/{project_id} due to missing quotas"
      )

    current_quota_limit_view = metrics.customize_quota_view(current_quota_limit)

    for net in network_dict:
      limits.set_limits(net, current_quota_limit_view, limit_dict)

      usage = 0
      if net['self_link'] in gce_instance_dict:
        usage = gce_instance_dict[net['self_link']]

      metric_labels = {
          'project': project_id,
          'network_name': net['network_name']
      }
      metrics.append_data_to_series_buffer(
          config, metrics_dict["metrics_per_network"]["instance_per_network"]
          ["usage"]["name"], usage, metric_labels, timestamp=timestamp)
      metrics.append_data_to_series_buffer(
          config, metrics_dict["metrics_per_network"]["instance_per_network"]
          ["limit"]["name"], net['limit'], metric_labels, timestamp=timestamp)
      metrics.append_data_to_series_buffer(
          config, metrics_dict["metrics_per_network"]["instance_per_network"]
          ["utilization"]["name"], usage / net['limit'], metric_labels,
          timestamp=timestamp)

    print(f"Buffered number of instances to metric for projects/{project_id}")
