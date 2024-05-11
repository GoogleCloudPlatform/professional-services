#!/bin/bash

gcloud beta compute instances create winvm \
    --image=windows-server-1809-dc-core-for-containers-v20200114 \
    --image-project=windows-cloud \
    --machine-type n1-standard-4 \
    --scopes=cloud-platform,storage-full \
    --metadata windows-startup-script-cmd='winrm set winrm/config/Service/Auth @{Basic="true"}'

sleep 20

gcloud --quiet beta compute reset-windows-password winvm

gcloud compute firewall-rules create allow-winrm-ingress \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:5986 \
    --source-ranges=0.0.0.0/0
