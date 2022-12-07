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
from . import metrics, networks, limits, peerings, routers


def get_routes_for_router(config, project_id, router_region, router_name):
  '''
    Returns the same of dynamic routes learned by a specific Cloud Router instance

      Parameters:
        config (dict): The dict containing config like clients and limits
        project_id (string): Project ID for the project containing the Cloud Router.
        router_region (string): GCP region for the Cloud Router.
        router_name (string): Cloud Router name.
      Returns:
        sum_routes (int): Number of dynamic routes learned by the Cloud Router.
  '''
  request = config["clients"]["discovery_client"].routers().getRouterStatus(
      project=project_id, region=router_region, router=router_name)
  response = request.execute()

  sum_routes = 0

  if 'result' in response:
    if 'bgpPeerStatus' in response['result']:
      for peer in response['result']['bgpPeerStatus']:
        sum_routes += peer['numLearnedRoutes']

  return sum_routes


def get_routes_for_network(config, network_link, project_id, routers_dict):
  '''
    Returns a the number of dynamic routes for a given network

      Parameters:
        config (dict): The dict containing config like clients and limits
        network_link (string): Network self link.
        project_id (string): Project ID containing the network.
        routers_dict (dictionary of string: list of string): Dictionary with key as network link and value as list of router links.
      Returns:
        sum_routes (int): Number of routes in that network.
  '''
  sum_routes = 0

  if network_link in routers_dict:
    for router_link in routers_dict[network_link]:
      # Router link is using the following format:
      # 'https://www.googleapis.com/compute/v1/projects/PROJECT_ID/regions/REGION/routers/ROUTER_NAME'
      start = router_link.find("/regions/") + len("/regions/")
      end = router_link.find("/routers/")
      router_region = router_link[start:end]
      router_name = router_link.split('/routers/')[1]
      routes = get_routes_for_router(config, project_id, router_region,
                                     router_name)

      sum_routes += routes

  return sum_routes


def get_dynamic_routes(config, metrics_dict, limits_dict):
  '''
    This function gets the usage, limit and utilization for the dynamic routes per VPC
    note: assumes global routing is ON for all VPCs
      Parameters:
        config (dict): The dict containing config like clients and limits
        metrics_dict (dictionary of dictionary of string: string): metrics names and descriptions.
        limits_dict (dictionary of string: int): key is network link (or 'default_value') and value is the limit for that network
      Returns:
        dynamic_routes_dict (dictionary of string: int): key is network link and value is the number of dynamic routes for that network
  '''
  routers_dict = routers.get_routers(config)
  dynamic_routes_dict = defaultdict(int)

  timestamp = time.time()
  for project in config["monitored_projects"]:
    network_dict = networks.get_networks(config, project)

    for net in network_dict:
      sum_routes = get_routes_for_network(config, net['self_link'], project,
                                          routers_dict)
      dynamic_routes_dict[net['self_link']] = sum_routes

      if net['self_link'] in limits_dict:
        limit = limits_dict[net['self_link']]
      else:
        if 'default_value' in limits_dict:
          limit = limits_dict['default_value']
        else:
          print("Error: couldn't find limit for dynamic routes.")
          break

      utilization = sum_routes / limit
      metric_labels = {'project': project, 'network_name': net['network_name']}
      metrics.append_data_to_series_buffer(
          config, metrics_dict["metrics_per_network"]
          ["dynamic_routes_per_network"]["usage"]["name"], sum_routes,
          metric_labels, timestamp=timestamp)
      metrics.append_data_to_series_buffer(
          config, metrics_dict["metrics_per_network"]
          ["dynamic_routes_per_network"]["limit"]["name"], limit, metric_labels,
          timestamp=timestamp)
      metrics.append_data_to_series_buffer(
          config, metrics_dict["metrics_per_network"]
          ["dynamic_routes_per_network"]["utilization"]["name"], utilization,
          metric_labels, timestamp=timestamp)

    print("Buffered metrics for dynamic routes for VPCs in project", project)

    return dynamic_routes_dict


def get_routes_ppg(config, metric_dict, usage_dict, limit_dict):
  '''
    This function gets the usage, limit and utilization for the static or dynamic routes per VPC peering group.
    note: assumes global routing is ON for all VPCs for dynamic routes, assumes share custom routes is on for all peered networks
      Parameters:
        config (dict): The dict containing config like clients and limits
        metric_dict (dictionary of string: string): Dictionary with the metric names and description, that will be used to populate the metrics
        usage_dict (dictionnary of string:int): Dictionary with the network link as key and the number of resources as value
        limit_dict (dictionary of string:int): Dictionary with the network link as key and the limit as value
      Returns:
        None
  '''
  timestamp = time.time()
  for project_id in config["monitored_projects"]:
    network_dict_list = peerings.gather_peering_data(config, project_id)

    for network_dict in network_dict_list:
      network_link = f"https://www.googleapis.com/compute/v1/projects/{project_id}/global/networks/{network_dict['network_name']}"

      limit = limits.get_ppg(network_link, limit_dict)

      usage = 0
      if network_link in usage_dict:
        usage = usage_dict[network_link]

      # Here we add usage and limit to the network dictionary
      network_dict["usage"] = usage
      network_dict["limit"] = limit

      # For every peered network, get usage and limits
      for peered_network_dict in network_dict['peerings']:
        peered_network_link = f"https://www.googleapis.com/compute/v1/projects/{peered_network_dict['project_id']}/global/networks/{peered_network_dict['network_name']}"
        peered_usage = 0
        if peered_network_link in usage_dict:
          peered_usage = usage_dict[peered_network_link]

        peered_limit = limits.get_ppg(peered_network_link, limit_dict)

        # Here we add usage and limit to the peered network dictionary
        peered_network_dict["usage"] = peered_usage
        peered_network_dict["limit"] = peered_limit

      limits.count_effective_limit(config, project_id, network_dict,
                                   metric_dict["usage"]["name"],
                                   metric_dict["limit"]["name"],
                                   metric_dict["utilization"]["name"],
                                   limit_dict, timestamp)
      print(
          f"Buffered {metric_dict['usage']['name']} for peering group {network_dict['network_name']} in {project_id}"
      )


def get_static_routes_dict(config):
  '''
    Calls the Asset Inventory API to get all static custom routes under the GCP organization.
    Parameters:
      config (dict): The dict containing config like clients and limits
    Returns:
      routes_per_vpc_dict (dictionary of string: int): Keys are the network links and values are the number of custom static routes per network.
  '''
  routes_per_vpc_dict = defaultdict()
  usage_dict = defaultdict()

  read_mask = field_mask_pb2.FieldMask()
  read_mask.FromJsonString('name,versionedResources')

  response = config["clients"]["asset_client"].search_all_resources(
      request={
          "scope": f"organizations/{config['organization']}",
          "asset_types": ["compute.googleapis.com/Route"],
          "read_mask": read_mask
      })

  for resource in response:
    for versioned in resource.versioned_resources:
      static_route = dict()
      for field_name, field_value in versioned.resource.items():
        static_route[field_name] = field_value
      static_route["project_id"] = static_route["network"].split('/')[6]
      static_route["network_name"] = static_route["network"].split('/')[-1]
      network_link = f"https://www.googleapis.com/compute/v1/projects/{static_route['project_id']}/global/networks/{static_route['network_name']}"
      #exclude default vpc and peering routes, dynamic routes are not in Cloud Asset Inventory
      if "nextHopPeering" not in static_route and "nextHopNetwork" not in static_route:
        if network_link not in routes_per_vpc_dict:
          routes_per_vpc_dict[network_link] = dict()
          routes_per_vpc_dict[network_link]["project_id"] = static_route[
              "project_id"]
          routes_per_vpc_dict[network_link]["network_name"] = static_route[
              "network_name"]
        if static_route["destRange"] not in routes_per_vpc_dict[network_link]:
          routes_per_vpc_dict[network_link][static_route["destRange"]] = {}
        if "usage" not in routes_per_vpc_dict[network_link]:
          routes_per_vpc_dict[network_link]["usage"] = 0
        routes_per_vpc_dict[network_link][
            "usage"] = routes_per_vpc_dict[network_link]["usage"] + 1

  #output a dict with network links and usage only
  return {
      network_link_out: routes_per_vpc_dict[network_link_out]["usage"]
      for network_link_out in routes_per_vpc_dict
  }


def get_static_routes_data(config, metrics_dict, static_routes_dict,
                           project_quotas_dict):
  '''
    Determines and writes the number of static routes for each VPC in monitored projects, the per project limit and the per project utilization
    note: assumes custom routes sharing is ON for all VPCs
      Parameters:
        config (dict): The dict containing config like clients and limits
        metric_dict (dictionary of string: string): Dictionary with the metric names and description, that will be used to populate the metrics
        static_routes_dict (dictionary of dictionary: int): Keys are the network links and values are the number of custom static routes per network.
        project_quotas_dict (dictionary of string:int): Dictionary with the network link as key and the limit as value.
      Returns:
        None
  '''
  timestamp = time.time()
  project_usage = {project: 0 for project in config["monitored_projects"]}

  #usage is drilled down by network
  for network_link in static_routes_dict:

    project_id = network_link.split('/')[6]
    if (project_id not in config["monitored_projects"]):
      continue
    network_name = network_link.split('/')[-1]

    project_usage[project_id] = project_usage[project_id] + static_routes_dict[
        network_link]

    metric_labels = {"project": project_id, "network_name": network_name}
    metrics.append_data_to_series_buffer(
        config, metrics_dict["metrics_per_network"]["static_routes_per_project"]
        ["usage"]["name"], static_routes_dict[network_link], metric_labels,
        timestamp=timestamp)

  #limit and utilization are calculated by project
  for project_id in project_usage:
    current_quota_limit = project_quotas_dict[project_id]['global']["routes"][
        "limit"]
    if current_quota_limit is None:
      print(
          f"Could not determine static routes  metric for projects/{project_id} due to missing quotas"
      )
      continue
    # limit and utilization are calculted by project
    metric_labels = {"project": project_id}
    metrics.append_data_to_series_buffer(
        config, metrics_dict["metrics_per_network"]["static_routes_per_project"]
        ["limit"]["name"], current_quota_limit, metric_labels,
        timestamp=timestamp)
    metrics.append_data_to_series_buffer(
        config, metrics_dict["metrics_per_network"]["static_routes_per_project"]
        ["utilization"]["name"],
        project_usage[project_id] / current_quota_limit, metric_labels,
        timestamp=timestamp)

  return
