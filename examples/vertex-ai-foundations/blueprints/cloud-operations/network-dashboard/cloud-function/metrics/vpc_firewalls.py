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
from google.protobuf import field_mask_pb2
from . import metrics, networks


def get_firewalls_dict(config: dict):
    '''
    Calls the Asset Inventory API to get all VPC Firewall Rules under the GCP organization.

      Parameters:
        config (dict): The dict containing config like clients and limits
      Returns:
        firewalls_dict (dictionary of dictionary: int): Keys are projects, subkeys are networks, values count #of VPC Firewall Rules
  '''

    firewalls_dict = defaultdict(int)
    read_mask = field_mask_pb2.FieldMask()
    read_mask.FromJsonString('name,versionedResources')

    response = config["clients"]["asset_client"].search_all_resources(
        request={
            "scope": f"organizations/{config['organization']}",
            "asset_types": ["compute.googleapis.com/Firewall"],
            "read_mask": read_mask,
            "page_size": config["page_size"],
        })
    for resource in response:
        project_id = re.search("(compute.googleapis.com/projects/)([\w\-\d]+)",
                               resource.name).group(2)
        network_name = ""
        for versioned in resource.versioned_resources:
            for field_name, field_value in versioned.resource.items():
                if field_name == "network":
                    network_name = re.search("[a-z0-9\-]*$",
                                             field_value).group(0)
                    firewalls_dict[project_id] = defaultdict(
                        int
                    ) if not project_id in firewalls_dict else firewalls_dict[
                        project_id]
                    firewalls_dict[project_id][
                        network_name] = 1 if not network_name in firewalls_dict[
                            project_id] else firewalls_dict[project_id][
                                network_name] + 1
                    break
            break
    return firewalls_dict


def get_firewalls_data(config, metrics_dict, project_quotas_dict,
                       firewalls_dict):
    '''
    Gets the data for VPC Firewall Rules per VPC Network and writes it to the metric defined in vpc_firewalls_metric.

      Parameters:
        config (dict): The dict containing config like clients and limits
        metrics_dict (dictionary of dictionary of string: string): metrics names and descriptions.
        project_quotas_dict (dictionary of string:int): Dictionary with the network link as key and the limit as value.
        firewalls_dict (dictionary of  of dictionary of string: string): Keys are projects, subkeys are networks, values count #of VPC Firewall Rules
      Returns:
        None
  '''

    timestamp = time.time()
    for project_id in config["monitored_projects"]:

        current_quota_limit = project_quotas_dict[project_id]['global'][
            "firewalls"]
        if current_quota_limit is None:
            print(
                f"Could not determine VPC firewal rules  metric for projects/{project_id} due to missing quotas"
            )
            continue

        network_dict = networks.get_networks(config, project_id)

        project_usage = 0
        for net in network_dict:
            usage = 0
            if project_id in firewalls_dict and net[
                    'network_name'] in firewalls_dict[project_id]:
                usage = firewalls_dict[project_id][net['network_name']]
                project_usage += usage
            metric_labels = {
                'project': project_id,
                'network_name': net['network_name']
            }
            metrics.append_data_to_series_buffer(
                config,
                metrics_dict["metrics_per_project"]["firewalls"]["usage"]
                ["name"],
                usage,
                metric_labels,
                timestamp=timestamp)

        metric_labels = {'project': project_id}
        # firewall quotas are per project, not per single VPC
        metrics.append_data_to_series_buffer(
            config,
            metrics_dict["metrics_per_project"]["firewalls"]["limit"]["name"],
            current_quota_limit['limit'],
            metric_labels,
            timestamp=timestamp)
        metrics.append_data_to_series_buffer(
            config,
            metrics_dict["metrics_per_project"]["firewalls"]["utilization"]
            ["name"],
            project_usage / current_quota_limit['limit']
            if current_quota_limit['limit'] != 0 else 0,
            metric_labels,
            timestamp=timestamp)
        print(
            f"Buffered number of VPC Firewall Rules to metric for projects/{project_id}"
        )
