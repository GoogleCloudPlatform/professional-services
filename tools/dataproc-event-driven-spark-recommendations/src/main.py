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
Script that runs in Cloud Functions to describe all dataproc clusters and
generate spark property recommendations for these clusters.
"""

import os
import math
import json
import functions_framework
from google.cloud import dataproc_v1
from google.cloud import storage
from googleapiclient import discovery
from oauth2client.client import GoogleCredentials

_PROJECT_ID = os.environ.get('PROJECT_ID', 'Environment variable is not set.')
_REGION = os.environ.get('REGION', 'Environment variable is not set.')
_ZONE = os.environ.get('ZONE', 'Environment variable is not set.')
_BUCKET_NAME = os.environ.get('BUCKET_NAME', 'Environment variable is not set.')


def load_machine_type_info(m_type_str):
    """
    Get more details about a specific machine type
    """
    credentials = GoogleCredentials.get_application_default()
    service = discovery.build('compute', 'v1', credentials=credentials)
    filter_string = f'name:{m_type_str}'
    request = service.machineTypes().list(project=_PROJECT_ID,
                                          zone=_ZONE,
                                          filter=filter_string)

    dataproc_m_types = []
    while request is not None:
        response = request.execute()
        for m_type in response['items']:
            dataproc_m_types.append(m_type)
        request = service.machineTypes().list_next(previous_request=request,
                                                   previous_response=response)
    return dataproc_m_types


def upload_blob(bucket_name, destination_blob_name, data_from_flowfile_astring):
    """
    Uploads a file to the bucket.
    """

    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_string(data_from_flowfile_astring)


def evaluate_properties(cluster):
    """
    Evaluate each cluster's spark properties based on standardized
    best practices.

    Return report of necessary changes.
    """
    w_map = cluster.config.worker_config
    p_map = cluster.config.software_config.properties

    m_type_index = len(w_map.machine_type_uri.split('/')) - 1
    m_type_str = w_map.machine_type_uri.split('/')[m_type_index]
    m_type_info = load_machine_type_info(m_type_str)[0]

    m_type = m_type_info['name']
    nodes = int(w_map.num_instances)
    ram_per_node = m_type_info['memoryMb']
    vcores = m_type_info['guestCpus']

    executor_cores = str(p_map['spark:spark.executor.cores'])
    driver_cores = str(p_map['spark:spark.driver.cores'])
    executor_instances = str(p_map['spark:spark.executor.instances'])
    executor_memory = str(p_map['spark:spark.executor.memory'])
    driver_memory = str(p_map['spark:spark.driver.memory'])
    executor_memory_overhead = str(p_map['spark:spark.executor.memoryOverhead'])
    default_parallelism = str(p_map['spark:spark.default.parallelism'])
    sql_shuffle_partitions = str(p_map['spark:spark.sql.shuffle.partitions'])
    shuffle_spill_compress = str(p_map['spark:spark.shuffle.spill.compress'])
    checkpoint_compress = str(p_map['spark:spark.checkpoint.compress'])
    io_compression_codec = str(p_map['spark:spark.io.compression.codec'])
    dynamic_allocation = str(p_map['spark:spark.dynamicAllocation.enabled'])
    shuffle_service = str(p_map['spark:spark.shuffle.service.enabled'])

    if 'g' in executor_memory:
        executor_memory = gb_to_mb_property(executor_memory)
    if 'g' in driver_memory:
        driver_memory = gb_to_mb_property(driver_memory)
    if 'g' in executor_memory_overhead:
        executor_memory_overhead = gb_to_mb_property(executor_memory_overhead)

    executor_per_node = round((vcores - 1) / 5) if round(
        (vcores - 1) / 5) > 0 else 1

    rec_executor_instances = 1
    if (executor_per_node * nodes) - 1 > 0:
        rec_executor_instances = (executor_per_node * nodes) - 1

    rec_executor_memory = str(
        math.floor((ram_per_node - 1024) / executor_per_node * 0.9)) + 'm'
    rec_driver_memory = rec_executor_memory
    rec_executor_memory_overhead = str(
        math.ceil((ram_per_node - 1024) / executor_per_node * 0.1)) + 'm'
    rec_default_parallelism = ((executor_per_node * nodes) - 1) * 10
    rec_sql_shuffle_partitions = rec_default_parallelism

    recs = {}

    if executor_cores != 5:
        recs['spark:spark.executor.cores'] = 5

    if driver_cores != 5:
        recs['spark:spark.driver.cores'] = 5

    if shuffle_spill_compress != 'true':
        recs['spark:spark.shuffle.spill.compress'] = 'true'

    if checkpoint_compress != 'true':
        recs['spark:spark.checkpoint.compress'] = 'true'

    if io_compression_codec == '':
        codec_msg = 'snappy (if splittable files), lz4 (otherwise)'
        recs['spark:spark.io.compression.codec'] = codec_msg

    if shuffle_service == '':
        ss_msg = 'true (if multiple spark apps on cluster), false (otherwise)'
        recs['spark:spark.shuffle.service.enabled'] = ss_msg

    if dynamic_allocation == '':
        da_msg = 'true (if multiple spark apps on cluster), false (otherwise)'
        recs['spark:spark.dynamicAllocation.enabled'] = da_msg

    if executor_instances != rec_executor_instances:
        recs['spark:spark.executor.instances'] = rec_executor_instances

    if executor_memory != rec_executor_memory:
        recs['spark:spark.executor.memory'] = rec_executor_memory
    if driver_memory != rec_driver_memory:
        recs['spark:spark.driver.memory'] = rec_driver_memory

    if executor_memory_overhead != rec_executor_memory_overhead:
        recs[
            'spark:spark.executor.memoryOverhead'] = rec_executor_memory_overhead

    if default_parallelism != rec_default_parallelism:
        recs['spark:spark.default.parallelism'] = rec_default_parallelism

    if sql_shuffle_partitions != rec_sql_shuffle_partitions:
        recs['spark:spark.sql.shuffle.partitions'] = rec_sql_shuffle_partitions

    curr_conf = {}
    curr_conf['cluster_name'] = cluster.cluster_name
    curr_conf['m_type'] = m_type
    curr_conf['nodes'] = nodes
    curr_conf['vcores'] = vcores
    curr_conf['ram_per_node'] = ram_per_node
    curr_conf['spark.executor.cores'] = executor_cores
    curr_conf['spark.driver.cores'] = driver_cores
    curr_conf['spark.executor.instances'] = executor_instances
    curr_conf['spark.executor.memory'] = executor_memory
    curr_conf['spark.driver.memory'] = driver_memory
    curr_conf['spark.executor.memoryOverhead'] = executor_memory_overhead
    curr_conf['spark.default.parallelism'] = default_parallelism
    curr_conf['spark.sql.shuffle.partitions'] = sql_shuffle_partitions
    curr_conf['spark.shuffle.spill.compress'] = shuffle_spill_compress
    curr_conf['spark.io.compression.codec'] = io_compression_codec
    curr_conf['spark.dynamicAllocation.enabled'] = dynamic_allocation
    curr_conf['spark.shuffle.service.enabled'] = shuffle_service

    report = {}
    report['curr_confuration'] = curr_conf
    report['recs'] = recs

    json_report = json.dumps(report, indent=4)

    return json_report


def gb_to_mb_property(prop):
    """
    Helper function to convert GB to MB
    """
    tmp = int(prop[:-1]) * 1024
    return str(tmp) + 'm'


def evaluate_persistent_disk(cluster):
    """
    Evaluate the size of a persistent disk config
    for a cluster
    """
    #TODO
    print(cluster)


def evaluate_dataproc_clusters():
    """
    iterate through all dataproc clusters in a gcp project and
    evaluate their properties.
    """
    # Create a client
    client = dataproc_v1.ClusterControllerClient(client_options={
        'api_endpoint': f'{_REGION}-dataproc.googleapis.com:443'
    })

    # Initialize request argument(s)
    request = client.list_clusters(
        project_id=_PROJECT_ID,
        region=_REGION,
    )

    # Handle the response
    for response in request:
        upload_blob(
            _BUCKET_NAME, 'dataproc-cluster-configuration-library/' +
            str(response.cluster_name), str(response))
        upload_blob(
            _BUCKET_NAME, 'dataproc-cluster-spark-recommendations/' +
            str(response.cluster_name), str(evaluate_properties(response)))


@functions_framework.cloud_event
def execute(trigger):
    """
    Cloud Function entry point.
    """
    evaluate_dataproc_clusters()
