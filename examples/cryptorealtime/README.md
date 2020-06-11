# CryptoRealTime

## A Google Cloud Dataflow/Cloud Bigtable Websockets example

The last year has been like a roller coaster for the cryptocurrency market. At the end of 2017, the value of bitcoin (BTC) almost reached $20,000 USD, only to fall below $4,000 USD a few months later. What if there is a pattern in the high volatility of the cryptocurrencies market? If so, can we learn from it and get an edge on future trends? Is there a way to observe all exchanges in real time and visualize it on a single chart?

In this tutorial we will graph the trades, volume and time delta from trade execution until it reaches our system (an indicator of how close to real time we can get the data).


![realtime multi exchange BTC/USD observer](crypto.gif)

[Consider reading the Medium article](https://medium.com/@igalic/bigtable-beam-dataflow-cryptocurrencies-gcp-terraform-java-maven-4e7873811e86)

[Terraform - get this up and running in less than 5 minutes](https://github.com/galic1987/professional-services/blob/master/examples/cryptorealtime/TERRAFORM-README.md)

## Architecture
![Cryptorealtime Cloud Architecture overview](https://i.ibb.co/dMc9bMz/Screen-Shot-2019-02-11-at-4-56-29-PM.png)

## Frontend
![Cryptorealtime Cloud Fronted overview](https://i.ibb.co/2S28KYq/Screen-Shot-2019-02-12-at-2-53-41-PM.png)

## Costs
This tutorial uses billable components of GCP, including:
- Cloud Dataflow
- Compute Engine
- Cloud Storage
- Cloud Bigtable

We recommend to clean up the project after finishing this tutorial to avoid costs. Use the [Pricing Calculator](https://cloud.google.com/products/calculator/) to generate a cost estimate based on your projected usage.

## Project setup
### Install the Google Cloud Platform SDK on a new VM
  * Log into the console, and activate a cloud console session
  * Create a new VM
```console
gcloud beta compute instances create crypto-driver \
  --zone=us-central1-a \
  --machine-type=n1-standard-1 \
  --service-account=$(gcloud iam service-accounts list --format='value(email)' --filter="compute") \
  --scopes=https://www.googleapis.com/auth/cloud-platform \
  --image=debian-9-stretch-v20181210 \
  --image-project=debian-cloud \
  --boot-disk-size=20GB \
  --boot-disk-device-name=crypto-driver
```


  * SSH into that VM

```console
  gcloud compute ssh --zone=us-central1-a crypto-driver
```

  * Installing necessary tools like java, git, maven, pip, python and Cloud Bigtable command line tool cbt using the following command:
```console
  sudo -s
  apt-get update -y
  curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
  sudo python3 get-pip.py
  sudo pip3 install virtualenv
  virtualenv -p python3 venv
  source venv/bin/activate
  sudo apt -y --allow-downgrades install openjdk-8-jdk git maven google-cloud-sdk=271.0.0-0 google-cloud-sdk-cbt=271.0.0-0

```

### Create a Google Cloud Bigtable instance
```console
export PROJECT=$(gcloud info --format='value(config.project)')
export ZONE=$(curl "http://metadata.google.internal/computeMetadata/v1/instance/zone" -H "Metadata-Flavor: Google"|cut -d/ -f4)
gcloud services enable bigtable.googleapis.com \
bigtableadmin.googleapis.com \
dataflow.googleapis.com

gcloud bigtable instances create cryptorealtime \
  --cluster=cryptorealtime-c1 \
  --cluster-zone=${ZONE} \
  --display-name=cryptorealtime \
  --cluster-storage-type=HDD \
  --instance-type=DEVELOPMENT
cbt -instance=cryptorealtime createtable cryptorealtime families=market
```

### Create a Bucket
```console
gsutil mb -p ${PROJECT} gs://realtimecrypto-${PROJECT}
```

### Create firewall for visualization server on port 5000
```console
gcloud compute firewall-rules create crypto-dashboard --action=ALLOW --rules=tcp:5000 --source-ranges=0.0.0.0/0 --target-tags=crypto-console --description="Open port 5000 for crypto visualization tutorial"

gcloud compute instances add-tags crypto-driver --tags="crypto-console" --zone=${ZONE}
```


### Clone the repo
```console
git clone https://github.com/GoogleCloudPlatform/professional-services
```

### Build the pipeline
```console
cd professional-services/examples/cryptorealtime
mvn clean install
```

### Start the DataFlow pipeline
```console
./run.sh ${PROJECT} \
cryptorealtime gs://realtimecrypto-${PROJECT}/temp \
cryptorealtime market
```

### Start the Webserver and Visualization
```console
cd frontend/
pip install -r requirements.txt
python app.py ${PROJECT} cryptorealtime cryptorealtime market
```

Find your external IP in [Compute console instance](https://console.cloud.google.com/compute/instances) and open it in your browser with port 5000 at the end e.g.
http://external-ip:5000/stream

You should be able to see the visualization of aggregated BTC/USD pair on several exchanges (without predictor part)


# Cleanup
* To save on cost we can clean up the pipeline by running the following command
```console
gcloud dataflow jobs cancel \
  $(gcloud dataflow jobs list \
  --format='value(id)' \
  --filter="name:runthepipeline*")
```

* Empty and Delete the bucket:
```console
  gsutil -m rm -r gs://realtimecrypto-${PROJECT}/*
  gsutil rb gs://realtimecrypto-${PROJECT}
```

* Delete the Cloud Bigtable instance:
```console
  gcloud bigtable instances delete cryptorealtime
```

* Exit the VM and delete it.
```console
  gcloud compute instances delete crypto-driver --delete-disks
```

1. View the status of your Dataflow job in the Cloud Dataflow console

1. After a few minutes, from the shell,

```console
  cbt -instance=<bigtable-instance-name> read <bigtable-table-name>
```

Should return many rows of crypto trades data that the frontend project will read for it's dashboard.


## External libraries used to connnect to exchanges
https://github.com/bitrich-info/xchange-stream


