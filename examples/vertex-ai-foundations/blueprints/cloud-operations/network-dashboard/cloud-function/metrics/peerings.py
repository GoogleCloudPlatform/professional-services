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

from . import metrics, networks, limits


def get_vpc_peering_data(config, metrics_dict, limit_dict):
  '''
    Gets the data for VPC peerings (active or not) and writes it to the metric defined (vpc_peering_active_metric and vpc_peering_metric).

      Parameters:
        config (dict): The dict containing config like clients and limits
        metrics_dict (dictionary of dictionary of string: string): metrics names and descriptions
        limit_dict (dictionary of string:int): Dictionary with the network link as key and the limit as value
      Returns:
        None
  '''
  timestamp = time.time()
  for project in config["monitored_projects"]:
    active_vpc_peerings, vpc_peerings = gather_vpc_peerings_data(
        config, project, limit_dict)

    for peering in active_vpc_peerings:
      metric_labels = {
          'project': project,
          'network_name': peering['network_name']
      }
      metrics.append_data_to_series_buffer(
          config, metrics_dict["metrics_per_network"]
          ["vpc_peering_active_per_network"]["usage"]["name"],
          peering['active_peerings'], metric_labels, timestamp=timestamp)
      metrics.append_data_to_series_buffer(
          config, metrics_dict["metrics_per_network"]
          ["vpc_peering_active_per_network"]["limit"]["name"],
          peering['network_limit'], metric_labels, timestamp=timestamp)
      metrics.append_data_to_series_buffer(
          config, metrics_dict["metrics_per_network"]
          ["vpc_peering_active_per_network"]["utilization"]["name"],
          peering['active_peerings'] / peering['network_limit'], metric_labels,
          timestamp=timestamp)
    print(
        "Buffered number of active VPC peerings to custom metric for project:",
        project)

    for peering in vpc_peerings:
      metric_labels = {
          'project': project,
          'network_name': peering['network_name']
      }
      metrics.append_data_to_series_buffer(
          config, metrics_dict["metrics_per_network"]["vpc_peering_per_network"]
          ["usage"]["name"], peering['peerings'], metric_labels,
          timestamp=timestamp)
      metrics.append_data_to_series_buffer(
          config, metrics_dict["metrics_per_network"]["vpc_peering_per_network"]
          ["limit"]["name"], peering['network_limit'], metric_labels,
          timestamp=timestamp)
      metrics.append_data_to_series_buffer(
          config, metrics_dict["metrics_per_network"]["vpc_peering_per_network"]
          ["utilization"]["name"],
          peering['peerings'] / peering['network_limit'], metric_labels,
          timestamp=timestamp)
    print("Buffered number of VPC peerings to custom metric for project:",
          project)


def gather_peering_data(config, project_id):
  '''
    Returns a dictionary of all peerings for all networks in a project.

      Parameters:
        config (dict): The dict containing config like clients and limits
        project_id (string): Project ID for the project containing the networks.
      Returns:
        network_list (dictionary of string: string): Contains the project_id, network_name(s) and network_id(s) of peered networks.
  '''
  request = config["clients"]["discovery_client"].networks().list(
      project=project_id)
  response = request.execute()

  network_list = []
  if 'items' in response:
    for network in response['items']:
      net = {
          'project_id': project_id,
          'network_name': network['name'],
          'network_id': network['id'],
          'peerings': []
      }
      if 'peerings' in network:
        STATE = network['peerings'][0]['state']
        if STATE == "ACTIVE":
          for peered_network in network[
              'peerings']:  # "projects/{project_name}/global/networks/{network_name}"
            start = peered_network['network'].find("projects/") + len(
                'projects/')
            end = peered_network['network'].find("/global")
            peered_project = peered_network['network'][start:end]
            peered_network_name = peered_network['network'].split(
                "networks/")[1]
            peered_net = {
                'project_id':
                    peered_project,
                'network_name':
                    peered_network_name,
                'network_id':
                    networks.get_network_id(config, peered_project,
                                            peered_network_name)
            }
            net["peerings"].append(peered_net)
      network_list.append(net)
  return network_list


def gather_vpc_peerings_data(config, project_id, limit_dict):
  '''
    Gets the data for all VPC peerings (active or not) in project_id and writes it to the metric defined in vpc_peering_active_metric and vpc_peering_metric.

      Parameters:
        config (dict): The dict containing config like clients and limits
        project_id (string): We will take all VPCs in that project_id and look for all peerings to these VPCs.
        limit_dict (dictionary of string:int): Dictionary with the network link as key and the limit as value
      Returns:
        active_peerings_dict (dictionary of string: string): Contains project_id, network_name, network_limit for each active VPC peering.
        peerings_dict (dictionary of string: string): Contains project_id, network_name, network_limit for each VPC peering.
  '''
  active_peerings_dict = []
  peerings_dict = []
  request = config["clients"]["discovery_client"].networks().list(
      project=project_id)
  response = request.execute()
  if 'items' in response:
    for network in response['items']:
      if 'peerings' in network:
        STATE = network['peerings'][0]['state']
        if STATE == "ACTIVE":
          active_peerings_count = len(network['peerings'])
        else:
          active_peerings_count = 0

        peerings_count = len(network['peerings'])
      else:
        peerings_count = 0
        active_peerings_count = 0

      network_link = f"https://www.googleapis.com/compute/v1/projects/{project_id}/global/networks/{network['name']}"
      network_limit = limits.get_ppg(network_link, limit_dict)

      active_d = {
          'project_id': project_id,
          'network_name': network['name'],
          'active_peerings': active_peerings_count,
          'network_limit': network_limit
      }
      active_peerings_dict.append(active_d)
      d = {
          'project_id': project_id,
          'network_name': network['name'],
          'peerings': peerings_count,
          'network_limit': network_limit
      }
      peerings_dict.append(d)

  return active_peerings_dict, peerings_dict
