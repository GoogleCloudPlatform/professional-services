_PROJECT=<project-id>
_NETWORK=<my-default-vpc>
_VM_TEMPLATE_NAME=auto-gcloud-instance-template
_MACHINE_TYPE=e2-standard-32
_JAVA_XMS_GB=16
_JAVA_XMX_GB=96

_APP_STORAGE_PATH="gs://bucket/path/to/mainframe-connector-assembly-5.7.0.jar"
_DEPS_STORAGE_PATH="gs://bucket/path/to/mainframe-connector-assembly-5.7.0-deps.jar"
_TLS_CERT_STORAGE_PATH="gs://bucket/path/to/server.cert"
_TLS_PKEY_STORAGE_PATH="gs://bucket/path/to/server_rsa.key"
_TLS_GRPC_CHAIN_STORAGE_PATH="gs://bucket/path/to/server1.pem"
_TLS_GRPC_KEY_STORAGE_PATH="gs://bucket/path/to/server1.key"
_DNS_ALT_NAME="subject alternative names in TLS certificate files for gRPC auth"

#https://cloud.google.com/sdk/gcloud/reference/beta/compute/instance-templates/create
gcloud compute instance-templates create $_VM_TEMPLATE_NAME \
 --project=$_PROJECT \
 --machine-type=$_MACHINE_TYPE \
 --image=debian-10-buster-v20211105 \
 --image-project=debian-cloud \
 --boot-disk-size=120GB \
 --boot-disk-type=pd-balanced \
 --scopes=default,bigquery,storage-rw \
 --network=$_NETWORK \
 --no-address \
 --tags=bmlu-server \
 --metadata=\
startup-script="$(cat ./startup-script.sh)",\
app-storage-path=$_APP_STORAGE_PATH,\
deps-storage-path=$_DEPS_STORAGE_PATH,\
tls-cert-path=$_TLS_CERT_STORAGE_PATH,\
tls-pkey-path=$_TLS_PKEY_STORAGE_PATH,\
java-xms-gb=$_JAVA_XMS_GB,\
java-xmx-gb=$_JAVA_XMX_GB, \
tls-grpc-chain-path=_TLS_GRPC_CHAIN_STORAGE_PATH,\
tls-grpc-key-path=_TLS_GRPC_KEY_STORAGE_PATH, \
dns_alt_name=_DNS_ALT_NAME