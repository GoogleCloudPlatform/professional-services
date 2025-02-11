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
[python](https://www.python.org/downloads/).

# Requirements
- [Python version 3.6 or higher](https://www.python.org/downloads/)
- [Pip version 7.0.0 or higher](https://python-poetry.org/docs/#installation)

# Usage

## Setup virtual environment

```
python3 -m venv .venv
source .venv/bin/activate
```

## Install dependencies

```
pip install -U -r requirements.txt
```

## Run Word Count

Run the following command to execute the pipeline on your local machine.

```
python3 main.py --source resources/catsum.txt --output /tmp/wordcount/output
```

or

**Assumes previously run `gcloud auth application-default login`**

```
python3 main.py --source gs://apache-beam-samples/shakespeare/* --output /tmp/wordcount/output
```
