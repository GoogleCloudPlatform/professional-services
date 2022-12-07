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

from code import interact
from collections import defaultdict
from google.protobuf import field_mask_pb2
from googleapiclient import errors
import http


def get_subnet_ranges_dict(config: dict):
  '''
    Calls the Asset Inventory API to get all Subnet ranges under the GCP organization.

      Parameters:
        config (dict): The dict containing config like clients and limits
      Returns:
        subnet_range_dict (dictionary of string: int): Keys are the network links and values are the number of subnet ranges per network.
  '''

  subnet_range_dict = defaultdict(int)
  read_mask = field_mask_pb2.FieldMask()
  read_mask.FromJsonString('name,versionedResources')

  response = config["clients"]["asset_client"].search_all_resources(
      request={
          "scope": f"organizations/{config['organization']}",
          "asset_types": ["compute.googleapis.com/Subnetwork"],
          "read_mask": read_mask,
          "page_size": config["page_size"],
      })
  for resource in response:
    ranges = 0
    network_link = None

    for versioned in resource.versioned_resources:
      for field_name, field_value in versioned.resource.items():
        if field_name == "network":
          network_link = field_value
          ranges += 1
        if field_name == "secondaryIpRanges":
          for range in field_value:
            ranges += 1

    if network_link in subnet_range_dict:
      subnet_range_dict[network_link] += ranges
    else:
      subnet_range_dict[network_link] = ranges

  return subnet_range_dict


def get_networks(config, project_id):
  '''
    Returns a dictionary of all networks in a project.

      Parameters:
        config (dict): The dict containing config like clients and limits
        project_id (string): Project ID for the project containing the networks.
      Returns:
        network_dict (dictionary of string: string): Contains the project_id, network_name(s) and network_id(s)
  '''
  request = config["clients"]["discovery_client"].networks().list(
      project=project_id)
  response = request.execute()
  network_dict = []
  if 'items' in response:
    for network in response['items']:
      network_name = network['name']
      network_id = network['id']
      self_link = network['selfLink']
      d = {
          'project_id': project_id,
          'network_name': network_name,
          'network_id': network_id,
          'self_link': self_link
      }
      network_dict.append(d)
  return network_dict


def get_network_id(config, project_id, network_name):
  '''
    Returns the network_id for a specific project / network name.

      Parameters:
        config (dict): The dict containing config like clients and limits
        project_id (string): Project ID for the project containing the networks.
        network_name (string): Name of the network
      Returns:
        network_id (int): Network ID.
  '''
  request = config["clients"]["discovery_client"].networks().list(
      project=project_id)
  try:
    response = request.execute()
  except errors.HttpError as err:
    # TODO: log proper warning
    if err.resp.status == http.HTTPStatus.FORBIDDEN:
      print(
          f"Warning: error reading networks for {project_id}. " +
          f"This can happen if you don't have permissions on the project, for example if the project is in another organization or a Google managed project"
      )
    else:
      print(f"Warning: error reading networks for {project_id}: {err}")
    return 0

  network_id = 0

  if 'items' in response:
    for network in response['items']:
      if network['name'] == network_name:
        network_id = network['id']
        break

  if network_id == 0:
    print(f"Error: network_id not found for {network_name} in {project_id}")

  return network_id


def get_limit_network(network_dict, network_link, quota_limit, limit_dict):
  '''
    Returns limit for a specific network and metric, using the GCP quota metrics or the values in the yaml file if not found.

      Parameters:
        network_dict (dictionary of string: string): Contains network information.
        network_link (string): Contains network link
        quota_limit (list of dictionaries of string: string): Current quota limit for all networks in that project.
        limit_dict (dictionary of string:int): Dictionary with the network link as key and the limit as value
      Returns:
        limit (int): Current limit for that network.
  '''
  if quota_limit:
    for net in quota_limit:
      if net['network_id'] == network_dict['network_id']:
        return net['value']

  if network_link in limit_dict:
    return limit_dict[network_link]
  else:
    if 'default_value' in limit_dict:
      return limit_dict['default_value']
    else:
      print(f"Error: Couldn't find limit for {network_link}")

  return 0
