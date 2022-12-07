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

from curses import KEY_MARK
import re
import time
import yaml
from google.api import metric_pb2 as ga_metric
from google.cloud import monitoring_v3
from . import peerings, limits, networks


def create_metrics(monitoring_project, config):
  '''
    Creates all Cloud Monitoring custom metrics based on the metric.yaml file
      Parameters:
        monitoring_project (string): the project where the metrics are written to
        config (dict): The dict containing config like clients and limits
      Returns:
        metrics_dict (dictionary of dictionary of string: string): metrics names and descriptions
        limits_dict (dictionary of dictionary of string: int): limits_dict[metric_name]: dict[network_name] = limit_value
  '''
  client = config["clients"]["monitoring_client"]
  existing_metrics = []
  for desc in client.list_metric_descriptors(name=monitoring_project):
    existing_metrics.append(desc.type)
  limits_dict = {}

  with open("./metrics.yaml", 'r') as stream:
    try:
      metrics_dict = yaml.safe_load(stream)

      for metric_list in metrics_dict.values():
        for metric_name, metric in metric_list.items():
          for sub_metric_key, sub_metric in metric.items():
            metric_link = f"custom.googleapis.com/{sub_metric['name']}"
            # If the metric doesn't exist yet, then we create it
            if metric_link not in existing_metrics:
              create_metric(sub_metric["name"], sub_metric["description"],
                            monitoring_project, config)
            # Parse limits for network and peering group metrics
            # Subnet level metrics have a different limit: the subnet IP range size
            if sub_metric_key == "limit" and metric_name != "ip_usage_per_subnet":
              limits_dict_for_metric = {}
              if "values" in sub_metric:
                for network_link, limit_value in sub_metric["values"].items():
                  limits_dict_for_metric[network_link] = limit_value
              limits_dict[sub_metric["name"]] = limits_dict_for_metric

      return metrics_dict, limits_dict
    except yaml.YAMLError as exc:
      print(exc)


def create_metric(metric_name, description, monitoring_project, config):
  '''
    Creates a Cloud Monitoring metric based on the parameter given if the metric is not already existing
      Parameters:
        metric_name (string): Name of the metric to be created
        description (string): Description of the metric to be created
        monitoring_project (string): the project where the metrics are written to
        config (dict): The dict containing config like clients and limits
      Returns:
        None
  '''
  client = config["clients"]["monitoring_client"]

  descriptor = ga_metric.MetricDescriptor()
  descriptor.type = f"custom.googleapis.com/{metric_name}"
  descriptor.metric_kind = ga_metric.MetricDescriptor.MetricKind.GAUGE
  descriptor.value_type = ga_metric.MetricDescriptor.ValueType.DOUBLE
  descriptor.description = description
  descriptor = client.create_metric_descriptor(name=monitoring_project,
                                               metric_descriptor=descriptor)
  print("Created {}.".format(descriptor.name))


def append_data_to_series_buffer(config, metric_name, metric_value,
                                 metric_labels, timestamp=None):
  '''
    Appends data to Cloud Monitoring custom metrics, using a buffer. buffer is flushed every BUFFER_LEN elements,
    any unflushed series is discarded upon function closure
      Parameters:
        config (dict): The dict containing config like clients and limits
        metric_name (string): Name of the metric
        metric_value (int): Value for the data point of the metric.
        matric_labels (dictionary of dictionary of string: string): metric labels names and values
        timestamp (float): seconds since the epoch, in UTC
      Returns:
        usage (int): Current usage for that network.
        limit (int): Current usage for that network.
  '''

  # Configurable buffer size to improve performance when writing datapoints to metrics
  buffer_len = 10

  series = monitoring_v3.TimeSeries()
  series.metric.type = f"custom.googleapis.com/{metric_name}"
  series.resource.type = "global"

  for label_name in metric_labels:
    if (metric_labels[label_name] != None):
      series.metric.labels[label_name] = metric_labels[label_name]

  timestamp = timestamp if timestamp != None else time.time()
  seconds = int(timestamp)
  nanos = int((timestamp - seconds) * 10**9)
  interval = monitoring_v3.TimeInterval(
      {"end_time": {
          "seconds": seconds,
          "nanos": nanos
      }})
  point = monitoring_v3.Point({
      "interval": interval,
      "value": {
          "double_value": metric_value
      }
  })
  series.points = [point]

  # TODO: sometimes this cashes with 'DeadlineExceeded: 504 Deadline expired before operation could complete' error
  # Implement exponential backoff retries?
  config["series_buffer"].append(series)
  if len(config["series_buffer"]) >= buffer_len:
    flush_series_buffer(config)


def flush_series_buffer(config):
  '''
    writes buffered metrics to Google Cloud Monitoring, empties buffer upon both failure/success
    config (dict): The dict containing config like clients and limits
  '''
  try:
    if config["series_buffer"] and len(config["series_buffer"]) > 0:
      client = config["clients"]["monitoring_client"]
      client.create_time_series(name=config["monitoring_project_link"],
                                time_series=config["series_buffer"])
      series_names = [
          re.search("\/(.+$)", series.metric.type).group(1)
          for series in config["series_buffer"]
      ]
      print("Wrote time series: ", series_names)
  except Exception as e:
    print("Error while flushing series buffer")
    print(e)

  config["series_buffer"] = []


def get_pgg_data(config, metric_dict, usage_dict, limit_metric, limit_dict):
  '''
    This function gets the usage, limit and utilization per VPC peering group for a specific metric for all projects to be monitored.
      Parameters:
        config (dict): The dict containing config like clients and limits
        metric_dict (dictionary of string: string): Dictionary with the metric names and description, that will be used to populate the metrics
        usage_dict (dictionnary of string:int): Dictionary with the network link as key and the number of resources as value
        limit_metric (string): Name of the existing GCP metric for limit per VPC network
        limit_dict (dictionary of string:int): Dictionary with the network link as key and the limit as value
      Returns:
        None
  '''
  for project_id in config["monitored_projects"]:
    network_dict_list = peerings.gather_peering_data(config, project_id)
    # Network dict list is a list of dictionary (one for each network)
    # For each network, this dictionary contains:
    #   project_id, network_name, network_id, usage, limit, peerings (list of peered networks)
    #   peerings is a list of dictionary (one for each peered network) and contains:
    #     project_id, network_name, network_id
    current_quota_limit = limits.get_quota_current_limit(
        config, f"projects/{project_id}", limit_metric)
    if current_quota_limit is None:
      print(
          f"Could not determine number of L7 forwarding rules to metric for projects/{project_id} due to missing quotas"
      )
      continue

    current_quota_limit_view = customize_quota_view(current_quota_limit)

    timestamp = time.time()
    # For each network in this GCP project
    for network_dict in network_dict_list:
      if network_dict['network_id'] == 0:
        print(
            f"Could not determine {metric_dict['usage']['name']} for peering group {network_dict['network_name']} in {project_id} due to missing permissions."
        )
        continue
      network_link = f"https://www.googleapis.com/compute/v1/projects/{project_id}/global/networks/{network_dict['network_name']}"

      limit = networks.get_limit_network(network_dict, network_link,
                                         current_quota_limit_view, limit_dict)

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

        current_peered_quota_limit = limits.get_quota_current_limit(
            config, f"projects/{peered_network_dict['project_id']}",
            limit_metric)
        if current_peered_quota_limit is None:
          print(
              f"Could not determine metrics for peering to projects/{peered_network_dict['project_id']} due to missing quotas"
          )
          continue

        peering_project_limit = customize_quota_view(current_peered_quota_limit)

        peered_limit = networks.get_limit_network(peered_network_dict,
                                                  peered_network_link,
                                                  peering_project_limit,
                                                  limit_dict)
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


def customize_quota_view(quota_results):
  '''
    Customize the quota output for an easier parsable output.
      Parameters:
        quota_results (string): Input from get_quota_current_usage or get_quota_current_limit. Contains the Current usage or limit for all networks in that project.
      Returns:
        quotaViewList (list of dictionaries of string: string): Current quota usage or limit.
  '''
  quotaViewList = []
  for result in quota_results:
    quotaViewJson = {}
    quotaViewJson.update(dict(result.resource.labels))
    quotaViewJson.update(dict(result.metric.labels))
    for val in result.points:
      quotaViewJson.update({'value': val.value.int64_value})
    quotaViewList.append(quotaViewJson)
  return quotaViewList