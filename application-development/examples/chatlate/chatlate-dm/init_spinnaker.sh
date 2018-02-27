#!/bin/bash

set -x
set -o errexit


GKE_CLUSTER_NAME=$1
GKE_CLUSTER_ZONE=$2
SPINNAKER_BUCKET_NAME=$3
APPLICATION_BUCKET_NAME=$4
PROJECT=$5

EXTERNAL_IP=`curl -H'Metadata-Flavor: Google'  http://metadata/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip`
API_LB_IP=$EXTERNAL_IP:8084
UI_LB_IP=$EXTERNAL_IP:9000


HAL_USER=halyard
KUBECONFIG=/etc/kubeconfig
SERVICE_ACCOUNT_DEST=/etc/gcs-account.json
GCR_ADDRESS=gcr.io
DOCKER_ACCOUNT=gcr_account



until gcloud --log-http compute project-info add-metadata --metadata applicationBucketName=$APPLICATION_BUCKET_NAME; do
   echo "failed updating applicationBucketName metadata retrying."
   sleep 5
done

echo "Install kubectl"
export KUBECONFIG
export CLOUD_SDK_REPO="cloud-sdk-$(lsb_release -c -s)"
echo "deb http://packages.cloud.google.com/apt $CLOUD_SDK_REPO main" |  tee -a /etc/apt/sources.list.d/google-cloud-sdk.list
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg |  apt-key add -
apt-get update -y
apt-get install -y kubectl google-cloud-sdk

echo "Installing Halyard (Used by Spinnaker)"
useradd -m $HAL_USER || true
curl -s -o /tmp/InstallHalyard.sh https://raw.githubusercontent.com/spinnaker/halyard/master/install/stable/InstallHalyard.sh
bash /tmp/InstallHalyard.sh -y --user $HAL_USER

echo "Configuring Halyard"
SA_EMAIL=$(gcloud info --format='value(config.account)')
gcloud services enable servicemanagement.googleapis.com -q || true
gcloud services enable iam.googleapis.com -q || true
gcloud iam service-accounts keys create $SERVICE_ACCOUNT_DEST  --iam-account $SA_EMAIL
chown $HAL_USER $SERVICE_ACCOUNT_DEST



hal config storage gcs edit --project $PROJECT --bucket $SPINNAKER_BUCKET_NAME --json-path $SERVICE_ACCOUNT_DEST
hal config storage edit --type gcs

REPOSITORIES=$PROJECT/chatlate-chat-java,$PROJECT/chatlate-translate-java

hal config provider docker-registry enable
hal config provider docker-registry account add $DOCKER_ACCOUNT --password-file $SERVICE_ACCOUNT_DEST --username _json_key --address $GCR_ADDRESS --repositories $REPOSITORIES || true

echo "Fetching k8s credentials"
gcloud config set container/use_client_certificate true
gcloud container clusters get-credentials $GKE_CLUSTER_NAME --zone=$GKE_CLUSTER_ZONE
chown $HAL_USER $KUBECONFIG

hal config provider kubernetes enable
hal config provider kubernetes account add my-k8s-account --docker-registries $DOCKER_ACCOUNT --kubeconfig-file $KUBECONFIG --namespaces=default || true

hal config version edit --version 1.4.2

hal config security authn ldap disable
rm -f /opt/spinnaker/config/gate-local.yml

hal deploy apply

# configure secret
cp $SERVICE_ACCOUNT_DEST key.json
kubectl create secret generic sa-key  --from-file key.json || true

TRANSLATE_URL=http://translate.endpoints.${PROJECT}.cloud.goog/



echo "Sleep a few minutes for Gate (Spinnaker's API) to start up"
for PORT in 9000 6379 7002 8089 8080 8084 8088 8083 8087 ; do
  until curl -s http://localhost:$PORT; do
   echo "Spinnaker on $PORT  not up yet, retrying in 5 seconds."
   sleep 5
  done
done

echo "Create the Spinnaker Chat app"
curl -s -H "Content-Type: application/json" -X POST -d '{"job":[{"type":"createApplication","application":{"cloudProviders":"kubernetes","instancePort":80,"name":"chat","email":"nobody@nowhere"},"user":"[anonymous]"}],"application":"chat","description":"Create Application: chat"}' http://localhost:8084/applications/chat/tasks

echo "Create the Spinnaker load balancer"
curl -s  -H "Content-Type: application/json" -X POST -d '{"job":[{"provider":"kubernetes","stack":"prod","detail":"","serviceType":"LoadBalancer","account":"my-k8s-account","namespace":"default","ports":[{"protocol":"TCP","port":80,"name":"http"}],"externalIps":[],"sessionAffinity":"None","clusterIp":"","loadBalancerIp":"","name":"chat-prod","serviceAnnotations":{},"cloudProvider":"kubernetes","availabilityZones":{"default":["default"]},"type":"upsertLoadBalancer","user":"[anonymous]"}],"application":"chat","description":"Create Load Balancer: chat-prod"}' http://localhost:8084/applications/chat/tasks

echo "Create the Spinnaker pipeline"
curl -s  -H "Content-Type: application/json" -X POST -d '{"application":"chat","index":0,"keepWaitingPipelines":false,"lastModifiedBy":"anonymous","limitConcurrent":true,"name":"deploy-to-prod","stages":[{"refId":"1","requisiteStageRefIds":[],"type":"deploy","name":"Deploy","clusters":[{"strategy":"highlander","account":"my-k8s-account","application":"chat","targetSize":1,"cloudProvider":"kubernetes","namespace":"default","containers":[{"name":"'$PROJECT'-chatlate-chat-java","imageDescription":{"repository":"'$PROJECT'/chatlate-chat-java","imageId":"gcr.io/'$PROJECT'/chatlate-chat-java (Tag resolved at runtime)","registry":"gcr.io","fromTrigger":true,"account":"gcr_account"},"imagePullPolicy":"IFNOTPRESENT","requests":{"memory":null,"cpu":null},"limits":{"memory":null,"cpu":null},"ports":[{"name":"http","containerPort":80,"protocol":"TCP","hostPort":null,"hostIp":null}],"livenessProbe":null,"readinessProbe":null,"envVars":[{"name":"TRANSLATE_URL","value":"'$TRANSLATE_URL'"}],"command":[],"args":[],"volumeMounts":[]}],"volumeSources":[],"terminationGracePeriodSeconds":30,"deployment":{"enabled":false,"minReadySeconds":0,"deploymentStrategy":{"type":"RollingUpdate","rollingUpdate":{"maxUnavailable":1,"maxSurge":1}}},"interestingHealthProviderNames":["KubernetesContainer","KubernetesPod"],"dnsPolicy":"ClusterFirst","replicaSetAnnotations":{},"podAnnotations":{},"nodeSelector":{},"loadBalancers":["chat-prod"],"provider":"kubernetes","region":"default"}]}],"triggers":[{"enabled":true,"type":"docker","account":"gcr_account","registry":"gcr.io","organization":"'$PROJECT'","repository":"'$PROJECT'/chatlate-chat-java"}],"updateTs":"1509301448633"}' http://localhost:8084/pipelines


echo "Create the Spinnaker Translate app"
curl -s -H "Content-Type: application/json" -X POST -d '{"job":[{"type":"createApplication","application":{"cloudProviders":"kubernetes","instancePort":80,"name":"translate","email":"nobody@nowhere"},"user":"[anonymous]"}],"application":"translate","description":"Create Application: translate"}' http://localhost:8084/applications/translate/tasks

echo "Create the Spinnaker load balancer"
curl -s  -H "Content-Type: application/json" -X POST -d '{"job":[{"provider":"kubernetes","stack":"prod","detail":"","serviceType":"LoadBalancer","account":"my-k8s-account","namespace":"default","ports":[{"protocol":"TCP","port":80,"name":"http"}],"externalIps":[],"sessionAffinity":"None","clusterIp":"","loadBalancerIp":"","name":"translate-prod","serviceAnnotations":{},"cloudProvider":"kubernetes","availabilityZones":{"default":["default"]},"type":"upsertLoadBalancer","user":"[anonymous]"}],"application":"translate","description":"Create Load Balancer: translate-prod"}' http://localhost:8084/applications/translate/tasks

echo "Create the Spinnaker pipeline"
curl -s  -H "Content-Type: application/json" -X POST -d '{"application":"translate","index":0,"keepWaitingPipelines":false,"lastModifiedBy":"anonymous","limitConcurrent":true,"name":"deploy-to-prod","stages":[{"refId":"1","requisiteStageRefIds":[],"type":"deploy","name":"Deploy","clusters":[{"strategy":"highlander","account":"my-k8s-account","application":"translate","targetSize":1,"cloudProvider":"kubernetes","namespace":"default","containers":[{"name":"'$PROJECT'-chatlate-translate-java","imageDescription":{"repository":"'$PROJECT'/chatlate-translate-java","imageId":"gcr.io/'$PROJECT'/chatlate-translate-java (Tag resolved at runtime)","registry":"gcr.io","fromTrigger":true,"account":"gcr_account"},"imagePullPolicy":"IFNOTPRESENT","requests":{"memory":null,"cpu":null},"limits":{"memory":null,"cpu":null},"ports":[{"name":"http","containerPort":80,"protocol":"TCP","hostPort":null,"hostIp":null}],"livenessProbe":null,"readinessProbe":null,"envVars":[],"command":[],"args":[],"volumeMounts":[{"name":"sa-key","readOnly":true,"mountPath":"/etc/keys"}]}],"volumeSources":[{"type":"SECRET","name":"sa-key","hostPath":{"path":"/"},"emptyDir":{"medium":"DEFAULT"},"defaultPersistentVolumeClaim":{"claimName":"","readOnly":true},"secret":{"secretName":"sa-key"},"configMap":{"configMapName":"","items":[{"key":"","path":""}]},"awsElasticBlockStore":{"volumeId":"","fsType":"","partition":0}}],"terminationGracePeriodSeconds":30,"deployment":{"enabled":false,"minReadySeconds":0,"deploymentStrategy":{"type":"RollingUpdate","rollingUpdate":{"maxUnavailable":1,"maxSurge":1}}},"interestingHealthProviderNames":["KubernetesContainer","KubernetesPod"],"dnsPolicy":"ClusterFirst","replicaSetAnnotations":{},"podAnnotations":{},"nodeSelector":{},"loadBalancers":["translate-prod"],"provider":"kubernetes","region":"default"}]}],"triggers":[{"enabled":true,"type":"docker","account":"gcr_account","registry":"gcr.io","organization":"'$PROJECT'","repository":"'$PROJECT'/chatlate-translate-java"}],"updateTs":"1509301448633"}' http://localhost:8084/pipelines




hal config security authn ldap edit --url ldap://localhost:389/ --user-dn-pattern 'uid={0},ou=users,dc=example,dc=com'
hal config security authn ldap enable
cat >  /opt/spinnaker/config/gate-local.yml  <<EOF
ldap:
  enabled: true
  url: ldap://localhost:389/
  managerDn: cn=Directory Manager
  managerPassword: fraggleb
  userDnPattern: uid={0},ou=users,dc=example,dc=com
EOF
hal config security ui edit --override-base-url http://$UI_LB_IP
hal config security api edit --override-base-url http://$API_LB_IP
hal deploy apply

apt-get upgrade -y google-cloud-sdk

echo "Create Cloud Endpoints for the Chat Microservice"
kubectl create -f endpoint-chat-lb.yaml
CHAT_APP=chat-prod
CHAT_CLOUD_ENDPOINT=chat-cloud-endpoint
until kubectl describe services $CHAT_APP | grep "LoadBalancer Ingress"
do
sleep 2
done
sleep 2
CHAT_APP_IP=`kubectl describe services $CHAT_APP | grep "LoadBalancer Ingress" | awk '{print $3}'`

until kubectl describe services $CHAT_CLOUD_ENDPOINT | grep "LoadBalancer Ingress"
do
sleep 2
done
sleep 2
CHAT_ENDPOINT_IP=`kubectl describe services $CHAT_CLOUD_ENDPOINT | grep "LoadBalancer Ingress" | awk '{print $3}'`

#Create the cloud endpoint
sed "s/CHAT_ENDPOINT_IP/$CHAT_ENDPOINT_IP/" endpoint-chat-api.yaml | sed "s/PROJECT_ID/$PROJECT/" > endpoint-chat-api_filled.yaml
gcloud endpoints services deploy endpoint-chat-api_filled.yaml

CHAT_ENDPOINT_VER=`gcloud endpoints configs list --service=chat.endpoints.$PROJECT.cloud.goog --format='value(id)' | head -1`

sed "s/CHAT_ENDPOINT_VER/$CHAT_ENDPOINT_VER/" endpoint-chat-esp.yaml | sed "s/CHAT_APP_IP/$CHAT_APP_IP/" | sed "s/PROJECT_ID/$PROJECT/" > endpoint-chat-esp_filled.yaml

kubectl create -f endpoint-chat-esp_filled.yaml

echo "Create Cloud Endpoints for the Translate Microservice"
kubectl create -f endpoint-translate-lb.yaml
TRANSLATE_APP=translate-prod
TRANSLATE_CLOUD_ENDPOINT=translate-cloud-endpoint
until kubectl describe services $TRANSLATE_APP | grep "LoadBalancer Ingress"
do
sleep 2
done
sleep 2
TRANSLATE_APP_IP=`kubectl describe services $TRANSLATE_APP | grep "LoadBalancer Ingress" | awk '{print $3}'`

until kubectl describe services $TRANSLATE_CLOUD_ENDPOINT | grep "LoadBalancer Ingress"
do
sleep 2
done
sleep 2
TRANSLATE_ENDPOINT_IP=`kubectl describe services $TRANSLATE_CLOUD_ENDPOINT | grep "LoadBalancer Ingress" | awk '{print $3}'`

#Create the cloud endpoint
sed "s/TRANSLATE_ENDPOINT_IP/$TRANSLATE_ENDPOINT_IP/" endpoint-translate-api.yaml | sed "s/PROJECT_ID/$PROJECT/" > endpoint-translate-api_filled.yaml
gcloud endpoints services deploy endpoint-translate-api_filled.yaml

TRANSLATE_ENDPOINT_VER=`gcloud endpoints configs list --service=translate.endpoints.$PROJECT.cloud.goog --format='value(id)' | head -1`

sed "s/TRANSLATE_ENDPOINT_VER/$TRANSLATE_ENDPOINT_VER/" endpoint-translate-esp.yaml | sed "s/TRANSLATE_APP_IP/$TRANSLATE_APP_IP/" | sed "s/PROJECT_ID/$PROJECT/" > endpoint-translate-esp_filled.yaml

kubectl create -f endpoint-translate-esp_filled.yaml
