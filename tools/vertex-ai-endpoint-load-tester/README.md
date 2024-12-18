```
# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
```

# Vertex AI Endpoint Stress Tester

go/vertex-endpoint-stress-tester

## Introduction

Vertex AI Endpoints are a great managed solution to deploy ML models at scale. By their architecture, the Vertex AI Endpoints use GKE or similar infrastructure components in the background to enable seamless deployment and inference capabilities for any ML model, be it AutoML or Custom ones.

In some of our recent engagements, we have seen questions or queries raised about the scalability perspective of Vertex AI Endpoints. There is this sample notebook available in GitHub under the Google Cloud Platform account, which explains one of the many ways to check how much load a particular instance handles. However, it is not an automated solution which anyone from GCC can use with ease. Also, it involves some tedious and manual activities as well of creating and deleting endpoints and deploying ML models on them to test the load that specific type of VM can handle. In lieu of the fact that Vertex AI endpoint service continues to grow and supports variety of instance types, this procedure requires an improvement, so that it is easy for anyone from GCC to deploy a given ML model on a series of endpoints of various sizes and check which one is more suitable for the given workload, with some estimations about how much traffic this particular ML model will or is supposed to receive once it goes to Production.

This is where we propose our automated tool (proposed to be open sourced in the PSO GitHub and KitHub), the objective of which is to automatically perform stress testing for one particular model over various types of Endpoint configurations with and without autoscaling, so that we have data driven approach to decide the right sizing of the endpoint.

## Assumptions

1. That the ML model is already built, which this automation tool will not train, but will simply refer from BQML or Vertex AI model registry.
2. That the deployed ML model can accept a valid JSON request as input and provide online predictions as an output, preferably JSON.
3. That the user of this utility has at least an example JSON request file, put into the [requests](requests/) folder. Please see the existing [example](requests/request_movie.json) for clarity.

## How to Install & Run?

Out of the box, the utility can be run from the command line, so the best way to try it for the first time, is to:

1. Edit the [config](config/config.ini) file and select only 1 or 2 VM types.
2. Place the request JSON file into the [requests](requests/) folder. Please see the existing [example](requests/request_movie.json) for reference.
3. Run the utility as follows:


```
cd vertex-ai-endpoint-load-tester/
gcloud auth login
gcloud config set project PROJECT_ID 
python main.py
```

## Logging

When ran from the command line, all logs are printed on the console or STDOUT for user to validate. It is NOT stored anywhere else for historical references.
Hence we recommend installing this solution as a container on Cloud Run and run it as a Cloud Run service or job (as long as applicable) so that all logs can then be found from Cloud logging.

## Reporting/Analytics

TODO: This is an open feature, and will be added shortly. 
The idea here is to utilize a Looker Studio dashboard to visualize the results of the load testing, so that it is easily consumable by anyone!

## Troubleshooting

1. Check for requisite IAM permissions of the user or Service account on Cloud run (for example) who is running the job.
2. Ensure the [config](config/config.ini) file has no typo or additional information.
3. Ensure from Logs if there are any specific errors captured to debug further. 

## Known Errors

TODO

## Roadmap

In future, we can aim to extend this utility for LLMs or any other types of ML models. 
Further, we can also extend the same feature to load test other services in GCP, like GKE, which are frequently used to deploy ML solutions.

## Authors:

Ajit Sonawane - AI Engineer, Google Cloud
Suddhasatwa Bhaumik - AI Engineer, Google Cloud
