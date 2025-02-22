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

This directory holds code to build an Apache Beam pipeline written in
[java](https://www.java.com/en/).

# Requirements

*NOTE: installing gradle is not required*

- [Java version 11](https://www.oracle.com/java/technologies/downloads/#java11)

# Usage

## Running Word Count

Run the following command to execute the pipeline on your local machine.

```
./gradlew run -Pargs="--source=src/main/resources/catsum.txt"
```

or

**Assumes previously run `gcloud auth application-default login`**

```
./gradlew run -Pargs="--source=gs://apache-beam-samples/shakespeare/*"
```

## Show help

For help on command-line arguments, run:

```
./gradlew run -Pargs="-help=com.google.example.WordCountOptions"
```
