<!--
Copyright 2022 Google LLC

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

This module is responsible for provisioning the builder that builds the custom
Dataflow template. This module does not build the template itself but provisions
the process, using [Cloud Build](https://cloud.google.com/build)
that performs the build step.

This module achieves the following:

- Provision cloud build trigger
- Within cloud build trigger:
    1. Run the language specific build process i.e. gradle shadowJar, go build,
       etc.
    2. Execute the `gcloud dataflow flex-template` command with relevant
       arguments.

# Requirements

This module additionally requires the following steps before running the
solution. At this time there is not automated terraform solution for these
steps.

## 1. Fork the repository into your own GitHub organization or personal account

See documentation and example on forking a repository on GitHub

https://docs.github.com/en/get-started/quickstart/fork-a-repo

## 2. Connect forked repository to Cloud Build

Navigate to Cloud Build to connect your GitHub forked repository.

https://console.cloud.google.com/cloud-build/triggers/connect

**IGNORE "Create a Trigger" STEP. This module will build the trigger step**

See: https://cloud.google.com/build/docs/automating-builds/create-manage-triggers#connect_repo
for more details.
