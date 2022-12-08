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

from google.api_core import exceptions
from google.cloud import monitoring_v3
from . import metrics


def get_quotas_dict(quotas_list):
  '''
    Creates a dictionary of quotas from a list, with lower case quota name as keys
      Parameters:
        quotas_array (array): array of quotas
      Returns:
        quotas_dict (dict): dictionary of quotas
  '''
  quota_keys = [q['metric'] for q in quotas_list]
  quotas_dict = dict()
  i = 0
  for key in quota_keys:
    if ("metric" in quotas_list[i]):
      del (quotas_list[i]["metric"])
    quotas_dict[key.lower()] = quotas_list[i]
    i += 1
  return quotas_dict


def get_quota_project_limit(config, regions=["global"]):
  '''
    Retrieves quotas for all monitored project in selected regions, default 'global'
      Parameters:
        project_link (string): Project link.
      Returns:
        quotas (dict): quotas for all selected regions, default 'global'
  '''
  try:
    request = {}
    quotas = dict()
    for project in config["monitored_projects"]:
      quotas[project] = dict()
      if regions != ["global"]:
        for region in regions:
          request = config["clients"]["discovery_client"].compute.regions().get(
              region=region, project=project)
          response = request.execute()
          quotas[project][region] = get_quotas_dict(response['quotas'])
      else:
        region = "global"
        request = config["clients"]["discovery_client"].projects().get(
            project=project, fields="quotas")
        response = request.execute()
        quotas[project][region] = get_quotas_dict(response['quotas'])

    return quotas
  except exceptions.PermissionDenied:
    print(
        f"Warning: error reading quotas for {project}. " +
        "This can happen if you don't have permissions on the project, for example if the project is in another organization or a Google managed project"
    )
  return None


def get_ppg(network_link, limit_dict):
  '''
    Checks if this network has a specific limit for a metric, if so, returns that limit, if not, returns the default limit.

      Parameters:
        network_link (string): VPC network link.
        limit_list (list of string): Used to get the limit per VPC or the default limit.
      Returns:
        limit_dict (dictionary of string:int): Dictionary with the network link as key and the limit as value
  '''
  if network_link in limit_dict:
    return limit_dict[network_link]
  else:
    if 'default_value' in limit_dict:
      return limit_dict['default_value']
    else:
      print(f"Error: limit not found for {network_link}")
      return 0


def set_limits(network_dict, quota_limit, limit_dict):
  '''
    Updates the network dictionary with quota limit values.

      Parameters:
        network_dict (dictionary of string: string): Contains network information.
        quota_limit (list of dictionaries of string: string): Current quota limit.
        limit_dict (dictionary of string:int): Dictionary with the network link as key and the limit as value
      Returns:
        None
  '''

  network_dict['limit'] = None

  if quota_limit:
    for net in quota_limit:
      if net['network_id'] == network_dict['network_id']:
        network_dict['limit'] = net['value']
        return

  network_link = f"https://www.googleapis.com/compute/v1/projects/{network_dict['project_id']}/global/networks/{network_dict['network_name']}"

  if network_link in limit_dict:
    network_dict['limit'] = limit_dict[network_link]
  else:
    if 'default_value' in limit_dict:
      network_dict['limit'] = limit_dict['default_value']
    else:
      print(f"Error: Couldn't find limit for {network_link}")
      network_dict['limit'] = 0


def get_quota_current_limit(config, project_link, metric_name):
  '''
    Retrieves limit for a specific metric.

      Parameters:
        project_link (string): Project link.
        metric_name (string): Name of the metric.
      Returns:
        results_list (list of string): Current limit.
  '''

  try:
    results = config["clients"]["monitoring_client"].list_time_series(
        request={
            "name": project_link,
            "filter": f'metric.type = "{metric_name}"',
            "interval": config["monitoring_interval"],
            "view": monitoring_v3.ListTimeSeriesRequest.TimeSeriesView.FULL
        })
    results_list = list(results)
    return results_list
  except exceptions.PermissionDenied:
    print(
        f"Warning: error reading quotas for {project_link}. " +
        "This can happen if you don't have permissions on the project, for example if the project is in another organization or a Google managed project"
    )
  return None


def count_effective_limit(config, project_id, network_dict, usage_metric_name,
                          limit_metric_name, utilization_metric_name,
                          limit_dict, timestamp=None):
  '''
    Calculates the effective limits (using algorithm in the link below) for peering groups and writes data (usage, limit, utilization) to the custom metrics.
    Source: https://cloud.google.com/vpc/docs/quota#vpc-peering-effective-limit

      Parameters:
        config (dict): The dict containing config like clients and limits
        project_id (string): Project ID for the project to be analyzed.
        network_dict (dictionary of string: string): Contains all required information about the network to get the usage, limit and utilization.
        usage_metric_name (string): Name of the custom metric to be populated for usage per VPC peering group.
        limit_metric_name (string): Name of the custom metric to be populated for limit per VPC peering group.
        utilization_metric_name (string): Name of the custom metric to be populated for utilization per VPC peering group.
        limit_dict (dictionary of string:int): Dictionary containing the limit per peering group (either VPC specific or default limit).
        timestamp (time): timestamp to be recorded for all points
      Returns:
        None
  '''

  if timestamp == None:
    timestamp = time.time()

  if network_dict['peerings'] == []:
    return

  # Get usage: Sums usage for current network + all peered networks
  peering_group_usage = network_dict['usage']
  for peered_network in network_dict['peerings']:
    if 'usage' not in peered_network:
      print(
          f"Can not add metrics for peered network in projects/{project_id} as no usage metrics exist due to missing permissions"
      )
      continue
    peering_group_usage += peered_network['usage']

  network_link = f"https://www.googleapis.com/compute/v1/projects/{project_id}/global/networks/{network_dict['network_name']}"

  # Calculates effective limit: Step 1: max(per network limit, per network_peering_group limit)
  limit_step1 = max(network_dict['limit'], get_ppg(network_link, limit_dict))

  # Calculates effective limit: Step 2: List of max(per network limit, per network_peering_group limit) for each peered network
  limit_step2 = []
  for peered_network in network_dict['peerings']:
    peered_network_link = f"https://www.googleapis.com/compute/v1/projects/{peered_network['project_id']}/global/networks/{peered_network['network_name']}"

    if 'limit' in peered_network:
      limit_step2.append(
          max(peered_network['limit'], get_ppg(peered_network_link,
                                               limit_dict)))
    else:
      print(
          f"Ignoring projects/{peered_network['project_id']} for limits in peering group of project {project_id} as no limits are available."
          +
          "This can happen if you don't have permissions on the project, for example if the project is in another organization or a Google managed project"
      )

  # Calculates effective limit: Step 3: Find minimum from the list created by Step 2
  limit_step3 = 0
  if len(limit_step2) > 0:
    limit_step3 = min(limit_step2)

  # Calculates effective limit: Step 4: Find maximum from step 1 and step 3
  effective_limit = max(limit_step1, limit_step3)
  utilization = peering_group_usage / effective_limit
  metric_labels = {
      'project': project_id,
      'network_name': network_dict['network_name']
  }
  metrics.append_data_to_series_buffer(config, usage_metric_name,
                                       peering_group_usage, metric_labels,
                                       timestamp=timestamp)
  metrics.append_data_to_series_buffer(config, limit_metric_name,
                                       effective_limit, metric_labels,
                                       timestamp=timestamp)
  metrics.append_data_to_series_buffer(config, utilization_metric_name,
                                       utilization, metric_labels,
                                       timestamp=timestamp)
