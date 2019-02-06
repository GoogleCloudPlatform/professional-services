#!/bin/bash
readonly PRESTO_VERSION='0.213'
readonly HTTP_PORT='8080'
readonly GCS_CONNECTOR_VERSION='1.6.10'
readonly INIT_SCRIPT='/usr/lib/systemd/system/presto.service'

# Ephemeral Dataproc cluster name to be replaced
DATAPROC_CLUSTER_MASTER_NAME=${DATAPROC_CLUSTER_MASTER_NAME_TERRAFORM}
# url to get Instance metadata
readonly METADATA_URL="http://metadata.google.internal/computeMetadata/v1/instance"

# Custom metadata
readonly PRESTO_MASTER_FQDN=$(curl "$${METADATA_URL}/attributes/presto-master" -H "Metadata-Flavor: Google")
readonly ROLE=$(curl "$${METADATA_URL}/attributes/role" -H "Metadata-Flavor: Google")
readonly WORKER_COUNT=$(curl "$${METADATA_URL}/attributes/worker_count" -H "Metadata-Flavor: Google")

function err() {
   echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: $@" >&2
   return 1
}

function install_java(){
   apt-get update
   apt-get -y install default-jre
}

function get_presto(){
   # Download and unpack Presto server
   wget https://repo1.maven.org/maven2/com/facebook/presto/presto-server/$${PRESTO_VERSION}/presto-server-$${PRESTO_VERSION}.tar.gz
   tar -zxvf presto-server-$${PRESTO_VERSION}.tar.gz
   mkdir -p /var/presto/data
}

function configure_node_properties(){
   cat > presto-server-$${PRESTO_VERSION}/etc/node.properties <<EOF
node.environment=production
node.id=$(uuidgen)
node.data-dir=/var/presto/data
EOF
}

function configure_hive(){
   local metastore_uri
   metastore_uri="thrift://"$${DATAPROC_CLUSTER_MASTER_NAME}:9083

   cat > presto-server-$${PRESTO_VERSION}/etc/catalog/hive.properties <<EOF
connector.name=hive-hadoop2
hive.metastore.uri=$${metastore_uri}
EOF
}

# Replace the default JVM memory 16GB with appropriate value
function configure_jvm(){
   cat > presto-server-$${PRESTO_VERSION}/etc/jvm.config <<EOF
-server
-Xmx16G
-XX:+UseG1GC
-XX:G1HeapRegionSize=32M
-XX:+UseGCOverheadLimit
-XX:+ExplicitGCInvokesConcurrent
-XX:+HeapDumpOnOutOfMemoryError
-XX:+ExitOnOutOfMemoryError
EOF
}

# Set the configuration parameters with appropriate values
function configure_master(){
   # Configure master properties
   if [[ $${WORKER_COUNT} == 0 ]]; then
       # master on single-node is also worker
       include_coordinator='true'
   else
       include_coordinator='false'
   fi
   cat > presto-server-$${PRESTO_VERSION}/etc/config.properties <<EOF
coordinator=true
node-scheduler.include-coordinator=$${include_coordinator}
http-server.http.port=$${HTTP_PORT}
query.max-memory=50GB
query.max-memory-per-node=1GB
query.max-total-memory-per-node=2GB
discovery-server.enabled=true
# memory.heap-headroom-per-node=100MB
# resources.reserved-system-memory=100MB
discovery.uri=http://$${PRESTO_MASTER_FQDN}:$${HTTP_PORT}
EOF

   # Install cli
   wget https://repo1.maven.org/maven2/com/facebook/presto/presto-cli/$${PRESTO_VERSION}/presto-cli-$${PRESTO_VERSION}-executable.jar -O /usr/bin/presto
   chmod a+x /usr/bin/presto

}

# Set the configuration parameters with appropriate values
function configure_worker(){
   cat > presto-server-$${PRESTO_VERSION}/etc/config.properties <<EOF
coordinator=false
http-server.http.port=$${HTTP_PORT}
query.max-memory=50GB
query.max-memory-per-node=1GB
query.max-total-memory-per-node=2GB
# memory.heap-headroom-per-node=100MB
# resources.reserved-system-memory=100MB
discovery.uri=http://$${PRESTO_MASTER_FQDN}:$${HTTP_PORT}
EOF
}

function start_presto(){
   mkdir -p /usr/lib/systemd/system
   # Start presto as systemd job
   cat << EOF > $${INIT_SCRIPT}
[Unit]
Description=Presto DB
[Service]
Type=forking
ExecStart=/presto-server-$${PRESTO_VERSION}/bin/launcher.py start
ExecStop=/presto-server-$${PRESTO_VERSION}/bin/launcher.py stop
Restart=always
[Install]
WantedBy=multi-user.target
EOF

   chmod a+rw $${INIT_SCRIPT}
   systemctl daemon-reload
   systemctl enable presto
   systemctl start presto
   systemctl status presto
}

function configure_and_start_presto(){

   # Download GCS connector
   wget https://storage.googleapis.com/hadoop-lib/gcs/gcs-connector-$${GCS_CONNECTOR_VERSION}-hadoop2.jar \
    -O presto-server-$${PRESTO_VERSION}/plugin/hive-hadoop2/gcs-connector-$${GCS_CONNECTOR_VERSION}-hadoop2.jar
  
   # Configure Presto
   mkdir -p presto-server-$${PRESTO_VERSION}/etc/catalog

   configure_node_properties
   configure_hive
   configure_jvm

   if [[ "$${ROLE}" == 'Master' ]]; then
       configure_master
       start_presto
   else
       configure_worker
       start_presto
   fi
}

function main(){
   # startup-flag file used as a flag to run only once as initialization script
   if [[ ! -f ~/startup-flag ]]; then
   install_java
   get_presto
   configure_and_start_presto
   touch ~/startup-flag
   fi
}

main