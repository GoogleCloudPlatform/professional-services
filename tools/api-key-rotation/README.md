# GCP API key rotation checker

This script will crawl your entire GCP Organization (where you have permissions) and inform you of any API keys over 90 days that need to be rotated (as well as any < 90 days).

## Prerequisites
* The Cloud Resource Manager service enabled on your GCP project
* python 3.7+
* The following permissions (at a minimum):
    * `resourcemanager.projects.list`
    * `apikeys.keys.list`

## Quick Start

```bash
# set up GCP credentials
gcloud auth login

# Configure the default project
gcloud config set project $GCP_PROJECT_ID

# Enable the IAM credentials service
gcloud services enable cloudresourcemanager.googleapis.com

# Setup virtual environment
make setup

# Install required packages
make install

# Execute
make run
```

## Rotation Period

You are able to set a custom rotation period to check API keys against by passing in a number on the CLI. This is not required and the script defaults to 90.

To check against a 180 day rotation period:

```bash
python3 main.py 180
```


## Unit Tests

If you'd like to run unit tests:

```bash
# Setup virtual environment
make setup

# Install required packages
make dev

# Run unittests
make test
```
