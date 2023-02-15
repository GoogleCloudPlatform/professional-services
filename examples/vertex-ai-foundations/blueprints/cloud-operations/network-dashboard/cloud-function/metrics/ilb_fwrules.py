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

from collections import defaultdict
from google.protobuf import field_mask_pb2
from . import metrics, networks, limits


def get_forwarding_rules_dict(config, layer: str):
  '''
    Calls the Asset Inventory API to get all L4 Forwarding Rules under the GCP organization.

    Parameters:
      config (dict): The dict containing config like clients and limits
      layer (string): the Layer to get Forwarding rules (L4/L7)
    Returns:
      forwarding_rules_dict (dictionary of string: int): Keys are the network links and values are the number of Forwarding Rules per network.
  '''

  read_mask = field_mask_pb2.FieldMask()
  read_mask.FromJsonString('name,versionedResources')

  forwarding_rules_dict = defaultdict(int)

  response = config["clients"]["asset_client"].search_all_resources(
      request={
          "scope": f"organizations/{config['organization']}",
          "asset_types": ["compute.googleapis.com/ForwardingRule"],
          "read_mask": read_mask,
          "page_size": config["page_size"],
      })

  for resource in response:
    internal = False
    network_link = ""
    for versioned in resource.versioned_resources:
      for field_name, field_value in versioned.resource.items():
        if field_name == "loadBalancingScheme":
          internal = (field_value == config["lb_scheme"][layer])
        if field_name == "network":
          network_link = field_value
    if internal:
      if network_link in forwarding_rules_dict:
        forwarding_rules_dict[network_link] += 1
      else:
        forwarding_rules_dict[network_link] = 1

  return forwarding_rules_dict


def get_forwarding_rules_data(config, metrics_dict, forwarding_rules_dict,
                              limit_dict, layer):
  '''
    Gets the data for L4 Internal Forwarding Rules per VPC Network and writes it to the metric defined in forwarding_rules_metric.

      Parameters:
        config (dict): The dict containing config like clients and limits
        metrics_dict (dictionary of dictionary of string: string): metrics names and descriptions.
        forwarding_rules_dict (dictionary of string: int): Keys are the network links and values are the number of Forwarding Rules per network.
        limit_dict (dictionary of string:int): Dictionary with the network link as key and the limit as value.
        layer (string): the Layer to get Forwarding rules (L4/L7)
      Returns:
        None
  '''

  timestamp = time.time()
  for project_id in config["monitored_projects"]:
    network_dict = networks.get_networks(config, project_id)

    current_quota_limit = limits.get_quota_current_limit(
        config, f"projects/{project_id}", config["limit_names"][layer])

    if current_quota_limit is None:
      print(
          f"Could not determine {layer} forwarding rules to metric for projects/{project_id} due to missing quotas"
      )
      continue

    current_quota_limit_view = metrics.customize_quota_view(current_quota_limit)

    for net in network_dict:
      limits.set_limits(net, current_quota_limit_view, limit_dict)

      usage = 0
      if net['self_link'] in forwarding_rules_dict:
        usage = forwarding_rules_dict[net['self_link']]

      metric_labels = {
          'project': project_id,
          'network_name': net['network_name']
      }
      metrics.append_data_to_series_buffer(
          config, metrics_dict["metrics_per_network"]
          [f"{layer.lower()}_forwarding_rules_per_network"]["usage"]["name"],
          usage, metric_labels, timestamp=timestamp)
      metrics.append_data_to_series_buffer(
          config, metrics_dict["metrics_per_network"]
          [f"{layer.lower()}_forwarding_rules_per_network"]["limit"]["name"],
          net['limit'], metric_labels, timestamp=timestamp)
      metrics.append_data_to_series_buffer(
          config, metrics_dict["metrics_per_network"]
          [f"{layer.lower()}_forwarding_rules_per_network"]["utilization"]
          ["name"], usage / net['limit'], metric_labels, timestamp=timestamp)

    print(
        f"Buffered number of {layer} forwarding rules to metric for projects/{project_id}"
    )