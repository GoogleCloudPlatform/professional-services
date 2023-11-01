# An Operational Framework For Memorystore Redis Clusters
This is a framework that provides the tools to apply cluster level operations that enable capabilities like cluster backups, migration & validation, etc. The framework can be extended for other use cases as required. The framework uses RIOT to bridge current product gaps with Memorystore Clusters

## Prerequisites

1. A Google Compute Engine (GCE) instance where you must have [RIOT](https://developer.redis.com/riot/) installed since the script runs a subprocess to execute the riot command.

```sudo apt-get install redis-tools
sudo apt install openjdk-17-jdk
sudo apt install openjdk-17-jre
wget https://github.com/redis-developer/riot/releases/download/v3.1.5/riot-3.1.5.zip
```

Move the zip to the location where you want the binaries to reside

```
sudo mv riot-3.1.5.zip /var/opt/riot/
cd /var/opt/riot/
```

Unzip the file

```
sudo apt install unzip
sudo unzip riot-3.1.5.zip
```
2. Update the config.json with the bin path

3. The GCE instance's service account must have the required permissions to write logs into Cloud Logging and create files in GCS buckets.



## migrate-validate-mrc.py
The script supports the following replication types:

- validate: This type of replication will only validate the data between the two clusters. It will not replicate any data from the source cluster to the target cluster.
- replace: This type of replication will delete all of the data from the target cluster and then replicate all of the data from the source cluster to the target cluster.
- incremental: This type of replication will only replicate the data from the source cluster to the target cluster that has not already been replicated.

The script also supports an optional sampling factor that takes the value between 0 and 1. The sampling factor determines the percentage of keys that will be validated. For example, if the sampling factor is set to 0.1, only 10% of the keys in the source and target clusters will be validated. The default is 0.3

To use the script, first run the following command to parse the command-line arguments:
```
python3 migrate-validate-mrc.py --sourcehost <hostname> --sourceport <port> --tgthost <hostname> --tgtport <port> [--sampling_factor 0.3 --replication_mode validate] 
```

Where:

- `sourcehost` is the hostname of the source Redis instance.
- `sourceport` is the port number of the source Redis instance.
- `tgthost` is the hostname of the target Redis instance.
- `tgtport` is the port number of the target Redis instance.
- `sampling_factor` is the sampling factor. The default is 0.3.
- `replication_mode` is the replication type, Acceptable values are incremental/replace/validate

## backup-mrc.py
This script uses the Redis CLI to export data from a Redis instance to a Google Cloud Storage (GCS) bucket or a local path.

To use the script, run the following command:

```bash
python backup-mrc.py -i HOST -p PORT -c CLUSTER -b BUCKET
```

Where:

- `HOST` is the Redis host.
- `PORT` is the Redis port.
- `CLUSTER` is the Redis cluster name.
- `BUCKET` is the GCS bucket name. Use the gs:// prefix to specify the bucket. If the gs:// prefix is not specified, the script will create the path in the local filesystem.
  

## restore-mrc.py

This script can be used to restore a Redis cluster from a JSON backup file.

To use the script, run the following command:

```python restore-mrc.py -i HOSTIP -p PORT -b BUCKET -m MODE```

where:

- `HOSTIP` is the IP address of the Redis host.
- `PORT` is the port number of the Redis host.
- `BUCKET` is the name of the GCS bucket that contains the backup file.
- `MODE` is the mode of the restore operation. The mode can be either `append` or `replace`.




