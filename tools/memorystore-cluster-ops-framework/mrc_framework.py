#!/usr/bin/env python
# Copyright 2023 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import redis
import subprocess
import time
from google.cloud import logging
import os
import json
import requests

def read_config():
    """
    Read the configuration file.

    Returns:
        dict: The configuration dictionary.
    """
    with open('config.json', 'r') as config_file:
        config = json.load(config_file)
        return config

OUTPUT_LOGS = read_config()['OUTPUT_LOGS']


class redisCluster(redis.cluster.RedisCluster):
    """
    A class to interact with a Redis cluster.

    Args:
        host (str): The host of the Redis cluster.
        port (int): The port of the Redis cluster.
        password (str): The password of the Redis cluster.
    """

    def __init__(self, host, port, password):
        """
        Initialize the RedisCluster object.

        Args:
            host (str): The host of the Redis cluster.
            port (int): The port of the Redis cluster.
            password (str): The password of the Redis cluster.
        """
        self.host = host
        self.port = port
        self.password = password
        self.client = redis.cluster.RedisCluster(host=self.host, port=self.port, password=self.password, decode_responses=False)
        # Connect to Redis
        redis_client = self.client
        # Get all nodes in the cluster
        self.cluster_nodes = redis_client.execute_command('CLUSTER NODES')
        
        super().__init__(host=host, port=port, password=password)

    
    def getDBSize(self):
        """
        Get the total number of keys in the Redis cluster.

        Returns:
            int: The total number of keys in the Redis cluster.
        """
        cluster_nodes = self.cluster_nodes
        key_count = {}
        for node in cluster_nodes:
            # Check if the node is a master
            if 'master' not in str(cluster_nodes[node]['flags']):
                continue
            
            # Extract the IP and port of the node
            node_ip, node_port = node.split(':')
    
            # Connect to each node and get the key count
            node_client = redis.Redis(host=node_ip, port=int(node_port), decode_responses=True)
            key_count[node] = node_client.dbsize()
            node_client.close()

        # Print the key count for each node
        for node, count in key_count.items():
            node_ip = node.split(':')[0]
            node_port = node.split(':')[1]

        totalDBSize = sum(key_count.values())
        return totalDBSize


    def nrandomkeys(self, n):
        """
        Get a list of `n` random keys from the Redis cluster.

        Args:
            n (int): The number of keys to return.

        Returns:
            set: A set of `n` random keys from the Redis cluster.
        """
        redis_client = self.client
        size = min(n, self.getDBSize())
        keys = set()
        counter = 0
        while counter <=size :
            key = redis_client.randomkey()
            keys.add(key)
            counter += 1
        return keys 

    def delAllKeys(self):
        """
        Delete all keys from the Redis cluster.
        """
        cluster_nodes = self.cluster_nodes
        
        for node in cluster_nodes:
            node_port = node.split(':')[1]
            node_ip = node.split(':')[0]
            node_client = redis.cluster.RedisCluster(host=node_ip, port=int(node_port), decode_responses=True)
            node_client.flushdb()
            write_log(f"DB successfully flushed", target=OUTPUT_LOGS)

    def getVal(self, key):
        """
        Get the value of a key from the Redis cluster.

        Args:
            key (str): The key to get the value of.

        Returns:
            str: The value of the key.
        """
        redis_client = self.client
        key_type = redis_client.type(key)
        if key_type == b'string':
            return redis_client.get(key)
        elif key_type == b'hash':
            return redis_client.hgetall(key)
        elif key_type == b'list':
            return redis_client.lrange(key, 0, -1)
        elif key_type == b'set':
            return redis_client.smembers(key)
        elif key_type == b'zset':
            return redis_client.zrange(key, 0, -1)
        else:

            write_log(f"Key type not supported", target=OUTPUT_LOGS)

            # Add more cases as needed
            return None
        
    def backup_cluster(self, cluster_name, gcs_bucket, file_type):
        """
        Backup the Redis cluster to a GCS bucket.

        Args:
            cluster_name (str): The name of the Redis cluster.
            gcs_bucket (str): The name of the GCS bucket to backup the cluster to.
        """

        # Generate timestamp
        timestamp = time.strftime("%Y%m%d%H%M%S")

        write_log(f"Exporting Redis data to GCS at {timestamp}",target=OUTPUT_LOGS)

        prefix = f"{gcs_bucket}/mrc-redis-backups/{cluster_name}"
        # Construct the output filename
        output_filename = f"export_{timestamp}.{file_type}"

        # Construct the path
        path = f"{prefix}/{output_filename}"

        write_log(f"File will be placed at {path}", target=OUTPUT_LOGS)

    
        # Check if the directory exists in case of local storage. 
        if not os.path.exists(prefix) and not gcs_bucket.startswith("gs://") :
            # Create the directory
            os.makedirs(prefix)
    
        # Construct the bash command

        riot_path = read_config()['riot_bin_path']
        does_file_exist(riot_path)
        
        bash_command = f"{riot_path}/riot -h {self.host} -p {self.port} -c file-export {path}"

        write_log(f"Executing bash command: {bash_command}", target=OUTPUT_LOGS)
        
        webhook_url = read_config()['SLACK_WEBHOOK_URL']

       
        # Run the bash command
        exec_subprocess(bash_command)
        write_log(f"Export successful. File uploaded to: {path}", target=OUTPUT_LOGS)
        send_slack_message(
        webhook_url=webhook_url,
        message=f"Backup successful for cluster {cluster_name} on {timestamp}")


    def restore_cluster(self, restore_file, mode = 'append'):
        """
        Restore the Redis cluster from a GCS backup.

        Args:
            restore_file (str): The path to the GCS backup file.
        """
        riot_path = read_config()['riot_bin_path']
        does_file_exist(riot_path)
        does_file_exist(restore_file)
        if mode == 'append':
            pass
        elif mode == 'replace':
            self.delAllKeys()
        else:
            write_log(f"Invalid mode", target=OUTPUT_LOGS)
            exit(1)

        bash_command = f"{riot_path}/riot -h {self.host} -p {self.port} -c dump-import {restore_file}"
        write_log(f"Executing bash command: {bash_command}", target=OUTPUT_LOGS)
        
        exec_subprocess(bash_command)
        write_log(f"Import successful.", target=OUTPUT_LOGS)

def exec_subprocess(bash_command):
    try:
        result = subprocess.run(bash_command, shell=True, check=True,capture_output = True, text = True)
        write_log(f"{result.stdout}", target=OUTPUT_LOGS)
        write_log(f"{result.stderr}", target=OUTPUT_LOGS)
    except subprocess.CalledProcessError as e:
        write_log(f"Error: {e.stderr}", target=OUTPUT_LOGS)
        exit(1)
        
        


        
def does_file_exist(file):
    """
    Check if a file exists.

    Args:
        file (str): The path to the file.

    Returns:
        bool: True if the file exists, False otherwise.
    """
    if os.path.exists(file):
        return True
    else:
        write_log(f"Error: {file} does not exist.",target=OUTPUT_LOGS)
        exit(1)


    
# Write to the log
def write_log(message, target = "console"):
        """
        Write a message to the log.

        Args:
            message (str): The message to write to the log.
        """
        if target == "console":
            print(message)
        elif target == "cloud-logging":    
            client = logging.Client()
            logger = client.logger('ms-validation-framework-logs') 
            logger.log_text(message)
        else:
            print(message)
            client = logging.Client()
            logger = client.logger('ms-validation-framework-logs') 
            logger.log_text(message)
            
def replicate_data(source , target, replication_mode = 'snapshot', verification_mode = ''):
    """
    Replicate data from one Redis cluster to another.

    Args:
        source (redisCluster): The source Redis cluster.
        target (redisCluster): The target Redis cluster.
    """
    # Generate timestamp
    sourcehost = source.host
    sourceport = source.port
    tgthost = target.host
    tgtport = target.port

    verificiation_mode = verification_mode
    replication_mode = replication_mode

    # Construct the bash command

    riot_path = read_config()['riot_bin_path']
    does_file_exist(riot_path)
   
    bash_command = f"{riot_path}/riot -h {sourcehost} -p {sourceport} --cluster replicate --mode={replication_mode} -h {tgthost} -p {tgtport}  --cluster {verificiation_mode}"
    write_log(f"Executing bash command: {bash_command}", target=OUTPUT_LOGS)
    
    try:
        subprocess.run(bash_command, shell=True, check=True)
    except subprocess.CalledProcessError as e:
        write_log(f"Error: {e.stderr}", target=OUTPUT_LOGS)
        exit(1)
    write_log(f"Replication successful", target=OUTPUT_LOGS)

def validateCounts(source, target):
    """
    Validate that the number of keys in two Redis clusters are the same.

    Args:
        source (redisCluster): The source Redis cluster.
        target (redisCluster): The target Redis cluster.
    """
    source_size = source.getDBSize()
    target_size = target.getDBSize()
    
    if source_size == target_size:
        write_log(f"Source and target DB sizes match: {source_size}. Count validation successful", target=OUTPUT_LOGS)
        return True
    else:
        write_log(f"Source and target DB sizes do not match: {source_size} != {target_size}", target=OUTPUT_LOGS)
        return False


def deepValidate(sampling_factor, src, tgt):
    """
    Deep validate the data in two Redis clusters.

    Args:
        sampling_factor (float): The sampling factor to use for the deep validation.
        src (redisCluster): The source Redis cluster.
        tgt (redisCluster): The target Redis cluster.
    """
    sample_count = int(round(sampling_factor * src.getDBSize()))
    # Get the samples to test in a list
    samples = src.nrandomkeys(sample_count)
    validationPassed = True 
    
    for key in samples:
        key_exists = tgt.exists(key)
        if key_exists:
            srcVal = src.getVal(key)
            tgtVal = tgt.getVal(key)

            if srcVal != tgtVal:
                write_log(f"Invalid Value for key '{key}':\n {tgtVal} \n {srcVal}", target=OUTPUT_LOGS) 

                validationPassed = False
            else:
                pass
        else:
            write_log(f"Key '{key}' is NOT present in Redis.", target=OUTPUT_LOGS)
            validationPassed = False
    
    if validationPassed:
        write_log(f"Deep validation successful", target=OUTPUT_LOGS)
    else:
        write_log(f"Deep validation failed", target=OUTPUT_LOGS)
    
    return validationPassed

def send_slack_message(webhook_url, message):
    payload = {
        "text": message
    }

    headers = {
        "Content-Type": "application/json"
    }

    response = requests.post(webhook_url, data=json.dumps(payload), headers=headers)

    if response.status_code == 200:
        write_log(f"Message sent successfully!", target=OUTPUT_LOGS)
    else:
        write_log(f"Message failed to send to SLACK", target=OUTPUT_LOGS)

