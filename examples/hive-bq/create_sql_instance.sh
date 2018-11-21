#!/bin/sh

# Name of the Instance to be created
INSTANCE_NAME=$1

# Password for the root user
ROOT_PASSWORD=$2

# IP Address of the cluster from which hive tables need to be migrated
CLUSTER_IP=$3

DATABASE_NAME="metadata"

# check if there is an existing instance with the given name
gcloud sql instances describe $INSTANCE_NAME > /dev/null

if [ $? -eq 0 ]; then
    echo "Instance with this name already exists.Try with a different name"
    exit 0
else
    # create cloud sql instance and add the cluster ip to authorized networks
    gcloud sql instances create $INSTANCE_NAME --tier=db-n1-standard-1 --region=us-east1 --authorized-networks $CLUSTER_IP
    if [ $? -eq 0 ]; then
        echo "Instance created successfully"
        gcloud sql databases create $DATABASE_NAME --instance $INSTANCE_NAME
        gcloud sql users set-password root --host % --instance $INSTANCE_NAME --password $ROOT_PASSWORD
        ipaddress=$(gcloud sql instances describe $INSTANCE_NAME --format="value(ipAddresses[0].ipAddress)")
        echo "IP Address of Cloud SQL Instance is "$ipaddress
    else
        echo "Instance creation failed"
    fi
fi
