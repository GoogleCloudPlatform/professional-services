# Copyright 2020 Google LLC
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
