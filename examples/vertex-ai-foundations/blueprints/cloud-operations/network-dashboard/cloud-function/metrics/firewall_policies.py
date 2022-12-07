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

import re
import time

from collections import defaultdict
from pydoc import doc
from collections import defaultdict
from google.protobuf import field_mask_pb2
from . import metrics, networks, limits


def get_firewall_policies_dict(config: dict):
  '''
    Calls the Asset Inventory API to get all Firewall Policies under the GCP organization, including children
    Ignores monitored projects list: returns all policies regardless of their parent resource
      Parameters:
        config (dict): The dict containing config like clients and limits
      Returns:
        firewal_policies_dict (dictionary of dictionary): Keys are policy ids, subkeys are policy field values
  '''

  firewall_policies_dict = defaultdict(int)
  read_mask = field_mask_pb2.FieldMask()
  read_mask.FromJsonString('name,versionedResources')

  response = config["clients"]["asset_client"].search_all_resources(
      request={
          "scope": f"organizations/{config['organization']}",
          "asset_types": ["compute.googleapis.com/FirewallPolicy"],
          "read_mask": read_mask,
      })
  for resource in response:
    for versioned in resource.versioned_resources:
      firewall_policy = dict()
      for field_name, field_value in versioned.resource.items():
        firewall_policy[field_name] = field_value
      firewall_policies_dict[firewall_policy['id']] = firewall_policy
  return firewall_policies_dict


def get_firewal_policies_data(config, metrics_dict, firewall_policies_dict):
  '''
    Gets the data for VPC Firewall Policies in an organization, including children. All folders are considered, 
    only projects in the monitored projects list are considered. 
      Parameters:
        config (dict): The dict containing config like clients and limits
        metrics_dict (dictionary of dictionary of string: string): metrics names and descriptions.
        firewall_policies_dict (dictionary of  of dictionary of string: string): Keys are policies ids, subkeys are policies values
      Returns:
        None
  '''

  current_tuples_limit = None
  try:
    current_tuples_limit = metrics_dict["metrics_per_firewall_policy"][
        "firewall_policy_tuples"]["limit"]["values"]["default_value"]
  except Exception:
    print(
        f"Could not determine number of tuples metric limit due to missing default value"
    )
  if current_tuples_limit < 0:
    print(
        f"Could not determine number of tuples metric limit  as default value is <= 0"
    )

  timestamp = time.time()
  for firewall_policy_key in firewall_policies_dict:
    firewall_policy = firewall_policies_dict[firewall_policy_key]

    # may either be a org, a folder, or a project
    # folder and org require to split {folder,organization}\/\w+
    parent = re.search("(\w+$)", firewall_policy["parent"]).group(
        1) if "parent" in firewall_policy else re.search(
            "([\d,a-z,-]+)(\/[\d,a-z,-]+\/firewallPolicies/[\d,a-z,-]*$)",
            firewall_policy["selfLink"]).group(1)
    parent_type = re.search("(^\w+)", firewall_policy["parent"]).group(
        1) if "parent" in firewall_policy else "projects"

    if parent_type == "projects" and parent not in config["monitored_projects"]:
      continue

    metric_labels = {'parent': parent, 'parent_type': parent_type}

    metric_labels["name"] = firewall_policy[
        "displayName"] if "displayName" in firewall_policy else firewall_policy[
            "name"]

    metrics.append_data_to_series_buffer(
        config, metrics_dict["metrics_per_firewall_policy"]
        [f"firewall_policy_tuples"]["usage"]["name"],
        firewall_policy['ruleTupleCount'], metric_labels, timestamp=timestamp)
    if not current_tuples_limit == None and current_tuples_limit > 0:
      metrics.append_data_to_series_buffer(
          config, metrics_dict["metrics_per_firewall_policy"]
          [f"firewall_policy_tuples"]["limit"]["name"], current_tuples_limit,
          metric_labels, timestamp=timestamp)
      metrics.append_data_to_series_buffer(
          config, metrics_dict["metrics_per_firewall_policy"]
          [f"firewall_policy_tuples"]["utilization"]["name"],
          firewall_policy['ruleTupleCount'] / current_tuples_limit,
          metric_labels, timestamp=timestamp)

  print(f"Buffered number tuples per Firewall Policy")
