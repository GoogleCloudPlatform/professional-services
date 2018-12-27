#!/bin/sh

# Name of the Instance to be created
INSTANCE_NAME=$1

# Database to be created
DATABASE_NAME=$2

# check if there is an existing instance with the given name
echo "Checking if instance exists with the same name"
gcloud sql instances describe $INSTANCE_NAME > /dev/null

if [ $? -eq 0 ]; then
    echo "Instance with this name already exists.Try with a different name"
    exit 0
else
    # create cloud sql instance and add the cluster ip to authorized networks
    gcloud sql instances create $INSTANCE_NAME --tier=db-n1-standard-1 --region=us-east1
    if [ $? -eq 0 ]; then
        echo "Instance created successfully"
        gcloud sql databases create $DATABASE_NAME --instance $INSTANCE_NAME
        gcloud sql users set-password root --host % --instance $INSTANCE_NAME --prompt-for-password
        output=$(gcloud sql instances describe $INSTANCE_NAME --format="value(connectionName,ipAddresses[0].ipAddress)")
        connectionName=$(echo $output | cut -d ' ' -f 1)
        ipaddress=$(echo $output | cut -d ' ' -f 2)
        echo "IP Address of Cloud SQL instance is "$ipaddress
        echo "Connection name of the instance is "$connectionName
    else
        echo "Instance creation failed"
    fi
fi