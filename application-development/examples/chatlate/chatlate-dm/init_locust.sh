#!/bin/bash -x


LOCUST_FILE=/locustfile.py

apt-get update
apt-get install -y python-pip python-dev
pip install locustio


TARGET_HOST=http://chat.endpoints.`gcloud info --format='value(config.project)'`.cloud.goog
locust -P 80 -f $LOCUST_FILE -H $TARGET_HOST
