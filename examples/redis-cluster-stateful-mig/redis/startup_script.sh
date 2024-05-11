#!/usr/bin/bash

# Copyright 2024 Google LLC
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

echo "**************************** script started ****************************"

#!/bin/bash

# Update package list
sudo apt-get update

# Install Redis server
sudo apt-get install -y redis-server

# Start Redis server
sudo systemctl start redis-server

# Enable Redis to start on system boot
sudo systemctl enable redis-server

# Install Nginx
sudo apt-get install -y nginx

# Start Nginx
sudo systemctl start nginx

# Enable Nginx to start on system boot
sudo systemctl enable nginx

# Display installation completion message
echo "Installation complete. Redis and Nginx are installed and running."


# Initialization of variables
DISK_ID="/dev/disk/by-id/google-data-disk"
MNT_DIR="/redis"
REDIS_STATE_GCS_BUCKET="gs://redis-demo-1"
mig_name=$( curl -s "http://metadata.google.internal/computeMetadata/v1/instance/attributes/created-by" -H "Metadata-Flavor: Google" | rev | cut -d"/" -f -1 | rev)
my_ip=$(curl -s "http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/ip" -H "Metadata-Flavor: Google")
cluster_join_ip=$(gcloud compute instance-groups list-instances $mig_name --region=${region} --uri | xargs -I '{}' gcloud compute instances describe '{}' --flatten networkInterfaces --format 'csv[no-heading](networkInterfaces.networkIP)' | grep -v $my_ip | head -1)

# Function to ensure the script runs only once
run_only_once() {
  if [[ -f "/etc/startup_was_launched" ]]; then exit 0; fi
}

# Function to mount the disk and update /etc/fstab
mount_disk() {
  MNT_DIR=$1
  DISK_ID=$2

  mkdir -p $MNT_DIR
  echo "**************************** mounting disk at $MNT_DIR ****************************"

  # Format and mount the disk if not already formatted as ext4
  if [[ $(lsblk $DISK_ID -no fstype) != 'ext4' ]]; then
    sudo mkfs.ext4 -m 0 -F -E lazy_itable_init=0,lazy_journal_init=0,discard $DISK_ID
  else
    sudo e2fsck -fp $DISK_ID
    sudo resize2fs $DISK_ID
  fi

  # Add an entry to /etc/fstab for persistent mount
  if [[ ! $(grep -qs $MNT_DIR  /proc/mounts) ]] && [[ ! $(grep -qs $MNT_DIR  /etc/fstab) ]]; then
    UUID=$(blkid -s UUID -o value $DISK_ID)
    echo "UUID=$UUID $MNT_DIR ext4 discard,defaults,nofail 0 2" | sudo tee -a /etc/fstab
  fi

  # Mount the disk
  sudo mount $MNT_DIR
}

# Function to join Redis cluster as a replica
join_redis_cluster_as_replica() {
  mig_name=$1
  my_ip=$2
  cluster_join_ip=$3

  echo "**************************** adding node to Redis cluster ****************************"

  # Update Redis configuration and restart service
  sudo sed "s/bind 127.0.0.1.*/bind $my_ip/g" /etc/redis/redis.conf -i
  sudo sed "s/^# cluster-enabled yes$/cluster-enabled yes/g" /etc/redis/redis.conf -i
  sudo sed "s/^dir \/var\/lib\/redis$/dir \/redis/g" /etc/redis/redis.conf -i
  sudo sed "s/^# appendonly yes/appendonly yes/g" /etc/redis/redis.conf -i
  sudo sed "s/^appendonly no/appendonly yes/g" /etc/redis/redis.conf -i
  sudo sed -i '/ReadWriteDirectories=-\/etc\/redis/a ReadWriteDirectories=-\/redis'  /lib/systemd/system/redis-server.service

  # make redis the owner of redis folder
  sudo chown -R redis:redis /redis
  sudo systemctl daemon-reload

  sudo service redis restart
  sleep 5

  echo "**************************** trying to join as replica ****************************"
  redis-cli --cluster add-node $my_ip:6379 $cluster_join_ip:6379 --cluster-slave
  return $?
}

# Function to validate if a Redis cluster already exists
validate_if_cluster_already_exist() {
  cluster_join_ip=$1
  nodes_in_cluster=$(redis-cli -h $cluster_join_ip cluster info | grep cluster_size | cut -d ':' -f 2 | cut -c1)

  if [[ $nodes_in_cluster == 0 ]]; then
    echo "Cluster not initialized. Please initialize the cluster"
    return 1
  fi

  echo "Cluster already has $nodes_in_cluster nodes in the cluster"
  return 0
}

# Function to initialize the Redis cluster
cluster_init() {
  mig_name=$1
  my_ip=$2
  sleep_seconds=$(( ( RANDOM % 100 ) + 1 ))

  echo "sleeping randomly for $sleep_seconds seconds"
  sleep $sleep_seconds

  echo "Triggering the cluster initialization"
  cluster_all_nodes_with_redis_port=$(gcloud compute instance-groups list-instances $mig_name --region=${region} --uri | xargs -I '{}' gcloud compute instances describe '{}' --flatten networkInterfaces --format 'csv[no-heading](networkInterfaces.networkIP)' | awk '{print $1":6379"}' | sort | tr '\n' ' ')

  is_cluster_initialized=false
  initialization_counter=0

  while [[ $is_cluster_initialized != 0 ]]; do
    initialization_counter=$(($initialization_counter + 1))
    echo "trying to initialize the cluster [$initialization_counter/10]"

    # Break the loop if cluster is not initialized after 10 tries.
    if [[ $initialization_counter -ge 10 ]]; then
      break
    fi

    echo "redis-cli --cluster create -h $my_ip:6379 $cluster_all_nodes_with_redis_port --cluster-replicas 1 --cluster-yes"
    redis-cli --cluster create -h $my_ip:6379 $cluster_all_nodes_with_redis_port --cluster-replicas 1 --cluster-yes
    is_cluster_initialized=$?

    if [[ $is_cluster_initialized == 0 ]]; then
      echo "Cluster initialized successfully"
    fi

    sleep 5
  done
}

configure_and_join_consul_cluster() {
  my_ip=$1
  echo "Configuring the consul agent"
  apt-get install consul -y
  cat > /etc/consul.d/redis-master-role.sh <<EOF
#!/bin/bash
if [[ master == \$(redis-cli -h $my_ip info replication | tr -d '\r' | grep role: | cut -d : -f2 ) ]]; then echo 'matched'; else slave; fi
EOF

cat > /etc/consul.d/redis-slave-role.sh <<EOF
#!/bin/bash
if [[ slave == \$(redis-cli -h $my_ip info replication | tr -d '\r' | grep role: | cut -d : -f2 ) ]]; then echo 'matched'; else slave; fi
EOF

chmod +x /etc/consul.d/redis-master-role.sh
chmod +x /etc/consul.d/redis-slave-role.sh

  cat > /etc/consul.d/default.json <<EOF
  {
      "advertise_addr": "$my_ip",
      "bind_addr": "$my_ip",
      "client_addr": "0.0.0.0",
      "datacenter": "${region}",
      "node_name": "$my_ip",
      "retry_join": [
        "provider=gce zone_pattern=${region}-.* tag_value=consul-cluster"
      ],
      "server": false,
      "autopilot": {
        "cleanup_dead_servers": true,
        "last_contact_threshold": "200ms",
        "max_trailing_logs": 250,
        "server_stabilization_time": "10s",
        "redundancy_zone_tag": "az",
        "disable_upgrade_migration": false,
        "upgrade_version_tag": ""
      },
      "ui": false,
      "enable_local_script_checks" : true,
      "services": [
        {
          "id": "redis-up",
          "name": "redis-up",
          "tags": [""],
          "checks": [
            {
              "args": ["redis-cli", "-h", "$my_ip", "ping"],
              "interval": "5s"
            }
          ]
        },
        {
          "id": "service1-redis-master",
          "name": "service1-redis-master",
          "tags": [""],
          "checks": [
            {
              "args": ["bash", "/etc/consul.d/redis-master-role.sh"],
              "interval": "5s"
            }
          ]
        },
        {
          "id": "service1-redis-slave",
          "name": "service1-redis-slave",
          "tags": [""],
          "checks": [
            {
              "args": ["bash", "/etc/consul.d/redis-slave-role.sh"],
              "interval": "5s"
            }
          ]
        }
      ]
    }
EOF
service consul restart
}
# Start execution
run_only_once
mount_disk $MNT_DIR $DISK_ID

join_redis_cluster_as_replica $mig_name $my_ip $cluster_join_ip
if [ $? -eq 0 ]; then
    echo "Node joined the cluster successfully"
else
    echo "Node failed to join the cluster"
    validate_if_cluster_already_exist $cluster_join_ip
    if [ $? -eq 1 ]; then
      echo "Initializing the cluster"
      cluster_init $mig_name $my_ip
    else
      echo "Cluster already initialized"
    fi
fi

# join consul cluster
configure_and_join_consul_cluster $my_ip

# Limiting to run only once
touch /etc/startup_was_launched
echo "**************************** script completed ****************************"
# Trigger any Chef playbook or other provisioning steps as needed
