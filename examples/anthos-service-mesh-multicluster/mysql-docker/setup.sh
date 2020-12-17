# Build docker image
docker built -t liaojianhe/mysql-test:v1.0.0 .

# Push docker image to DockerHub
docker push liaojianhe/mysql-test:v1.0.0

# Assume 'sample' namespace has been created and istio-injection labeled

# Deploy the application and service
kubectl apply -f mysql-test.yaml -n sample

# Deploy the gateway
kubectl apply -f mysql-test-gateway.yaml -n sample

# Invoke on cluster 3
curl http://34.94.58.160/query

# Invoke on cluster 4
curl http://35.235.106.163/query
