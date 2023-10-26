import redis
import subprocess
import time
from google.cloud import logging
import os
import json



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
            print("DB successfully flushed")
        
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
            print("Key type not supported")
            # Add more cases as needed
            return None
        
    def backup_cluster(self, cluster_name, gcs_bucket):
        """
        Backup the Redis cluster to a GCS bucket.

        Args:
            cluster_name (str): The name of the Redis cluster.
            gcs_bucket (str): The name of the GCS bucket to backup the cluster to.
        """

        # Generate timestamp
        timestamp = time.strftime("%Y%m%d%H%M%S")
        write_log(f"Exporting Redis data to GCS at {timestamp}")
        prefix = f"{gcs_bucket}/mrc-redis-backups/{cluster_name}"
        # Construct the output filename
        output_filename = f"export_{timestamp}.json"

        # Construct the path
        path = f"{prefix}/{output_filename}"
        write_log(f"File will be placed at {path}")
    
                
        if not os.path.exists(prefix) and not gcs_bucket.startswith("gs://") :
            # Create the directory
            os.makedirs(prefix)
    
        # Construct the bash command

        riot_path = read_config()['riot_bin_path']
        does_file_exist(riot_path)
        
        bash_command = f"{riot_path}/riot -h {self.host} -p {self.port} -c file-export {path}"
        write_log(f"Executing bash command: {bash_command}")
        
        try:
            # Run the bash command
            subprocess.run(bash_command, shell=True, check=True)
            print(f"Export successful. File uploaded to: {path}")
            write_log(f"Export successful. File uploaded to: {path}")
        except subprocess.CalledProcessError as e:
            print(f"Error: {e}")
            write_log(f"Error: {e}")

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
            print("Invalid mode")
            exit(1)

        bash_command = f"{riot_path}/riot -h {self.host} -p {self.port} -c dump-import {restore_file}"
        write_log(f"Executing bash command: {bash_command}")
        
        try:
            # Run the bash command
            subprocess.run(bash_command, shell=True, check=True)
            print(f"Import successful.")
           
        except subprocess.CalledProcessError as e:
            print(f"Error: {e}")

        
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
        write_log(f"Error: {file} does not exist.")
        exit(1)

def read_config():
    """
    Read the configuration file.

    Returns:
        dict: The configuration dictionary.
    """
    with open('config.json', 'r') as config_file:
        config = json.load(config_file)
        return config
    
# Write to the log
def write_log(message):
        """
        Write a message to the log.

        Args:
            message (str): The message to write to the log.
        """
        client = logging.Client()
        logger = client.logger('ms-validation-framework-logs') 
        logger.log_text(message)
        
def replicate_data(source , target):
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
   
    # Construct the bash command

    riot_path = read_config()['riot_bin_path']
    does_file_exist(riot_path)
    
    bash_command = f"{riot_path}/riot -h {sourcehost} -p {sourceport} --cluster replicate -h {tgthost} -p {tgtport} --cluster"
    print(f"Executing bash command: {bash_command}")
    
    try:
        # Run the bash command
        subprocess.run(bash_command, shell=True, check=True)
        print(f"Replication successful")
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")

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
        print(f"Source and target DB sizes match: {source_size}. Count validation successful")
        return True
    else:
        print(f"Source and target DB sizes do not match: {source_size} != {target_size}")

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
                print(f"Invalid Value for key '{key}':\n {tgtVal} \n {srcVal}") 
                validationPassed = False
            else:
                pass
        else:
            print(f"Key '{key}' is NOT present in Redis.")
            validationPassed = False
    
    if validationPassed:
        print("Deep validation successful")
    else:
        print("Deep validation failed")
    
    return validationPassed
