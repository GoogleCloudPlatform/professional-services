# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import os
import urllib

from googleapiclient import discovery

from gcs_to_gke_configmaps import cloud_logger
from gcs_to_gke_configmaps import get_credentials
from gcs_to_gke_configmaps import get_token
from gcs_to_gke_configmaps import logged
from gcs_to_gke_configmaps import setup_logging
from gcs_to_gke_configmaps.gcs import GCSObject
from gcs_to_gke_configmaps.k8s import GKECluster


@logged
def create_label_selector(bucket, object_to_watch):
    return "gcs_bucket={},gcs_object={}".format(bucket,
                                                object_to_watch)


@logged
def create_gcs_object(bucket, filename):
    return GCSObject(bucket, filename)


@logged
def create_gke_cluster(cluster_name, cluster_location, gcp_project):
    return GKECluster(cluster_name, cluster_location, gcp_project)


@logged
def process_finalize(gcs_object, gke_cluster, label_selector, filename):
    content = gcs_object.content()
    patch = True

    gke_cluster.update_k8s_configmaps(filename,
                                      content,
                                      label_selector,
                                      patch)


@logged
def process_delete(gke_cluster, label_selector, filename):
    """Handles the processing of the GCS object and ConfigMaps.
    Args:
        bucket (string): The name of the GCS bucket.
        filename (str): The name of the GCS object.
        object_to_watch (str): The name or prefix of the name of the object
                               being monitored.
        event_type (str): The GCS trigger event type.
    """
    content = ""
    patch = False

    gke_cluster.update_k8s_configmaps(filename,
                                      content,
                                      label_selector,
                                      patch)


@logged
def restart_pods(gke_cluster, label_selector):
    gke_cluster.bounce_k8s_pods(label_selector=label_selector)


def gcs_trigger(data, context):
    """Triggered by a change to a Cloud Storage bucket.
    Args:
         event (dict): Event payload.
         context (google.cloud.functions.Context): Metadata for the event.
    """
    setup_logging()

    event_type = context.event_type
    cloud_logger.info("Event Type: {}".format(event_type))
    bucket = data['bucket']
    filename = data['name']

    object_to_watch = os.environ.get("OBJECT_TO_WATCH", "")
    cluster_name = os.environ.get("CLUSTER_NAME")
    cluster_location = os.environ.get("CLUSTER_LOCATION")
    gcp_project = os.environ.get("GCP_PROJECT")

    if filename.startswith(object_to_watch) or object_to_watch == "":
        cloud_logger.info("Processing {}.".format(filename))
        label_selector = create_label_selector(bucket, object_to_watch)
        gcs_object = create_gcs_object(bucket, filename)
        gke_cluster = create_gke_cluster(cluster_name,
                                         cluster_location,
                                         gcp_project)

        if event_type == "google.storage.object.finalize":
            process_finalize(gcs_object, gke_cluster, label_selector, filename)
        elif event_type == "google.storage.object.delete":
            process_delete(gke_cluster, label_selector, filename)
    else:
        cloud_logger.info("Not Processing {}.  \
            Does not start with {}.".format(filename, object_to_watch))
