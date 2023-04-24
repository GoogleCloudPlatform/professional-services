#!/usr/bin/env python3
# encoding: utf-8

#    Copyright 2022 Google LLC
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
"""
Script that runs in Cloud Functions to resize Dataproc clusters based on
a provided cluster label key/value pair.
"""

import os
import functions_framework
from google.cloud import dataproc_v1

_PROJECT_ID = os.environ.get("PROJECT_ID", "Environment var not set.")
_REGION = os.environ.get("REGION", "Environment var not set.")
_LABEL_KEY = os.environ.get("LABEL_KEY", "Environment var not set.")
_LABEL_VAL = os.environ.get("LABEL_VAL", "Environment var not set.")
_PRI_SIZE = str(os.environ.get("PRIMARY_SIZE", "Environment var not set."))
_SEC_SIZE = str(os.environ.get("SECONDARY_SIZE", "Environment var not set."))

# Create a client with the endpoint set to the desired cluster region.
_DATAPROC_CLIENT = dataproc_v1.ClusterControllerClient(
    client_options={"api_endpoint": f"{_REGION}-dataproc.googleapis.com:443"})


def resize_cluster(cluster_name):
    """This sample walks a user through updating a Cloud Dataproc cluster
    using the Python client library.
    Args:
        project_id (str): Project to use for creating resources.
        region (str): Region where the resources should live.
        cluster_name (str): Name to use for creating a cluster.
    """

    print(f"Beginning cluster update: {cluster_name}")

    # Get cluster you wish to update.
    cluster = _DATAPROC_CLIENT.get_cluster(project_id=_PROJECT_ID,
                                           region=_REGION,
                                           cluster_name=cluster_name)

    mask = {
        "paths": {
            "config.worker_config.num_instances": _PRI_SIZE,
            "config.secondary_worker_config.num_instances": _SEC_SIZE,
        }
    }

    # Update cluster config
    cluster.config.worker_config.num_instances = int(_PRI_SIZE)
    cluster.config.secondary_worker_config.num_instances = int(_SEC_SIZE)

    # Update cluster
    operation = _DATAPROC_CLIENT.update_cluster(
        project_id=_PROJECT_ID,
        region=_REGION,
        cluster=cluster,
        cluster_name=cluster_name,
        update_mask=mask,
    )

    # Output a success message.
    updated_cluster = operation.result()
    print(f"Cluster was updated successfully: {updated_cluster.cluster_name}")


def get_cluster_names():
    """
    Return a list of cluster names that all have a given cluster label.
    """

    cluster_names = []
    filter_ex = f"labels.{_LABEL_KEY} = {_LABEL_VAL}"
    print(
        f"Searching for clusters based on the following filter expression: {filter_ex}"
    )

    for cluster in _DATAPROC_CLIENT.list_clusters(request={
            "project_id": _PROJECT_ID,
            "region": _REGION,
            "filter": filter_ex
    }):
        cluster_names.append(cluster.cluster_name)

    return cluster_names


@functions_framework.cloud_event
def execute(trigger):
    """
    Cloud Function entry point.
    """

    print(trigger)

    cluster_names = get_cluster_names()
    for cluster in cluster_names:
        resize_cluster(cluster)
