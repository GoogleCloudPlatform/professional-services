# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

apiVersion: v1
kind: ServiceAccount
metadata:
  name: storage-api-sa
  namespace: ${k8s_ns}
  annotations:
    iam.gke.io/gcp-service-account: ${google_sa}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: storage-api-deployment
  namespace: ${k8s_ns}
spec:
  selector:
    matchLabels:
      app: storage-api
  replicas: 2
  template:
    metadata:
      labels:
        app: storage-api
    spec:
      serviceAccountName: ${k8s_sa}
      containers:
      - name: storage-api
        image: ${image}:DIGEST
        ports:
        - containerPort: 3000
      nodeSelector:
        iam.gke.io/gke-metadata-server-enabled: "true"