<!--
Copyright 2023 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

# Overview

The purpose of this walkthrough is to create a [Dataflow](https://cloud.google.com/dataflow) streaming pipeline to read XML encoded messages from [PubSub](https://cloud.google.com/pubsub):

![Architecture](./img/Dataflow%20PubSub%20XML%20to%20GCS.png)

## Pipeline
This pipeline is developed with the [Beam Python SDK](https://beam.apache.org/documentation/sdks/python/)
- Please refer to the [Python](./python/) codebase

# A compatible qwiklabs environment

If you wish to execute this code within a Qwiklabs environment, you can use this [Stream messages from Pub/Sub by using Dataflow](https://cloud.google.com/pubsub/docs/stream-messages-dataflow)

# Recommendations and next steps

## Best practices

Best practice recommends a Dataflow job to:
1) Utilize a worker service account to access the pipeline's files and resources
2) Minimally necessary IAM permissions for the worker service account
3) Minimally required Google cloud services

## Exactly once and in order processing

Beam may, for redundancy purposes, sometimes process messages more than once and message ordering is not guaranteed by design. However, in order and exactly once processing of the messages is a possible when using PubSub and Dataflow tegether. If this is a solution requirement please refer to the following Google Cloud Blog's entry: [After Lambda: Exactly-once processing in Google Cloud Dataflow, Part 1](https://cloud.google.com/blog/products/data-analytics/after-lambda-exactly-once-processing-in-google-cloud-dataflow-part-1)
