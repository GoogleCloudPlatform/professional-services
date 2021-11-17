# Home Appliances’ Working Status Monitoring Using Gross Power Readings
The popularization of IoT devices and the evolvement of machine learning technologies have brought tremendous opportunities for new businesses. We demonstrate how home appliances’ (e.g. kettle and washing machine) working status (on/off) can be inferred from gross power readings collected by a smart meter together with state-of-art machine learning techniques. An end-to-end demo system is developed entirely on Google Cloud Platform as shown in the following figure. It includes
* Data collection and ingesting through Cloud IoT Core and Cloud Pub/Sub
* Machine learning model development using Tensorflow and training using Cloud Machine Learning Engine (CMLE)
* Machine Learning model serving using CMLE together with App Engine as frontend
* Data visualization and exploration using Colab
![system architecture](./img/arch.jpg)

## Steps to deploy the demo system

### Step 0. Prerequisite
Before you follow the instructions below to deploy our demo system, you need a Google cloud project if you don't have one. You can find detailed instructions [here](https://cloud.google.com/dataproc/docs/guides/setup-project).

After you have created a google cloud project, follow the instructions below:
```shell
# clone the repository storing all the necessary codes
git clone [REPO_URL]

cd professional-services/examples/e2e-home-appliance-status-monitoring

# remember your project's id in an environment variable
GOOGLE_PROJECT_ID=[your-google-project-id]

# create and download a service account
gcloud --project ${GOOGLE_PROJECT_ID} iam service-accounts create e2e-demo-sc
gcloud --project ${GOOGLE_PROJECT_ID} projects add-iam-policy-binding ${GOOGLE_PROJECT_ID} \
       --member "serviceAccount:e2e-demo-sc@${GOOGLE_PROJECT_ID}.iam.gserviceaccount.com" \
       --role "roles/owner"
gcloud --project ${GOOGLE_PROJECT_ID} iam service-accounts keys create e2e_demo_credential.json \
       --iam-account e2e-demo-sc@${GOOGLE_PROJECT_ID}.iam.gserviceaccount.com
GOOGLE_APPLICATION_CREDENTIALS=${PWD}"/e2e_demo_credential.json"

# create a new GCS bucket if you don't have one
BUCKET_NAME=[your-bucket-name]
gsutil mb -p ${GOOGLE_PROJECT_ID} gs://${BUCKET_NAME}/
```

You also need to enable the following APIs in the APIs & Services menu.
* Cloud ML Engine API
* Cloud IoT API
* Cloud PubSub API

### Step 1. Deploy a trained ML model in Cloud ML Engine.
You can download our trained model [from the `data` directory](./data/model.tar.bz2) or you can train your own model using the `ml/start.sh`.
Notice: you need to enable CLoud ML Engine API first.

If you are using our trained model:
```shell
# download our trained model
tar jxvf data/model.tar.bz2

# upload the model to your bucket
gsutil cp -r model gs://${BUCKET_NAME}
```

If you want to train your own model:
```shell
pip install ml/
cd ml

# use one of the following commands and your model should be saved in your cloud storage bucket

# train locally with default parameter
bash start.sh -l
# train locally with specified parameters
bash start.sh -l learning-rate=0.00001 lstm-size=128
# train on Cloud ML Engine with default parameter
bash start.sh -p ${GOOGLE_PROJECT_ID} -b ${BUCKET_NAME}
# train on Cloud ML Engine with specified parameters
bash start.sh -p ${GOOGLE_PROJECT_ID} -b ${BUCKET_NAME} learning-rate=0.00001 lstm-size=128
# run hyper-parameter tuning on Cloud ML Engine
bash start.sh -p ${GOOGLE_PROJECT_ID} -b ${BUCKET_NAME} -t
```

Finally let's deploy our model to ML engine:
```shell
# Set up an appropriate region
# Available regions: https://cloud.google.com/ml-engine/docs/tensorflow/regions
REGION="your-application-region"

# create a model
gcloud ml-engine models create EnergyDisaggregationModel \
      --regions ${REGION} \
      --project ${GOOGLE_PROJECT_ID}

# create a model version
gcloud ml-engine versions create v01 \
      --model EnergyDisaggregationModel \
      --origin gs://${BUCKET_NAME}/model \
      --runtime-version 1.12 \
      --framework TensorFlow \
      --python-version 3.5 \
      --project ${GOOGLE_PROJECT_ID}
```

### Step 2. Deploy server.
Type in the following commands to start server in app engine.
```shell
cd e2e_demo/server
cp ${GOOGLE_APPLICATION_CREDENTIALS} .
echo "  GOOGLE_APPLICATION_CREDENTIALS: '${GOOGLE_APPLICATION_CREDENTIALS##*/}'" >> app.yaml
echo "  GOOGLE_CLOUD_PROJECT: '${GOOGLE_PROJECT_ID}'" >> app.yaml

# deploy application engine, choose any region that suits and answer yes at the end.
gcloud --project ${GOOGLE_PROJECT_ID} app deploy

# create a pubsub topic "data" and a subscription in the topic.
# this is the pubsub between IoT devices and the server.
gcloud --project ${GOOGLE_PROJECT_ID} pubsub topics create data
gcloud --project ${GOOGLE_PROJECT_ID} pubsub subscriptions create sub0 \
       --topic=data --push-endpoint=https://${GOOGLE_PROJECT_ID}.appspot.com/upload

# create a pubsub topic "pred" and a subscription in the topic.
# this is the pubsub between the server and a result utilizing client.
gcloud --project ${GOOGLE_PROJECT_ID} pubsub topics create pred
gcloud --project ${GOOGLE_PROJECT_ID} pubsub subscriptions create sub1 --topic=pred

# uncompress the data 
bunzip data/*csv.bz2

# create BigQuery dataset and tables.
bq --project_id ${GOOGLE_PROJECT_ID} mk \
   --dataset ${GOOGLE_PROJECT_ID}:EnergyDisaggregation
bq --project_id ${GOOGLE_PROJECT_ID} load --autodetect \
   --source_format=CSV EnergyDisaggregation.ApplianceInfo \
   ./data/appliance_info.csv
bq --project_id ${GOOGLE_PROJECT_ID} load --autodetect \
   --source_format=CSV EnergyDisaggregation.ApplianceStatusGroundTruth \
   ./data/appliance_status_ground_truth.csv
bq --project_id ${GOOGLE_PROJECT_ID} mk \
   --table ${GOOGLE_PROJECT_ID}:EnergyDisaggregation.ActivePower \
   time:TIMESTAMP,device_id:STRING,power:INTEGER
bq --project_id ${GOOGLE_PROJECT_ID} mk \
   --table ${GOOGLE_PROJECT_ID}:EnergyDisaggregation.Predictions \
   time:TIMESTAMP,device_id:STRING,appliance_id:INTEGER,pred_status:INTEGER,pred_prob:FLOAT
```

### Step 3. Setup your Cloud IoT Client(s)
Follow the instructions below to set up your client(s).
Note: you need to enable the Cloud IoT API first.
```shell
# You need to specify the IDs for cloud iot registry and the devices you want.
# See more details for permitted characters and sizes for each resource:
# https://cloud.google.com/iot/docs/requirements#permitted_characters_and_size_requirements
REGISTRY_ID="your-registry-id"
DEVICE_IDS=("your-device-id1" "your-device-id2" ...)

# create an iot registry with created pubsub topic above
gcloud --project ${GOOGLE_PROJECT_ID} iot registries create ${REGISTRY_ID} \
       --region ${REGION} --event-notification-config topic=data

# generates key pair for setting in Cloud IoT device.
# The rs256.key generated by the following command would be used to create JWT.
ssh-keygen -t rsa -b 4096 -f ./rs256.key
# Press "Enter" twice
openssl rsa -in ./rs256.key -pubout -outform PEM -out ./rs256.pub

# create multiple devices
for device in ${DEVICE_IDS[@]}; do
  # create an iot device with generated public key and the registry.
  gcloud --project ${GOOGLE_PROJECT_ID} iot devices create ${device} \
         --region ${REGION} --public-key path=./rs256.pub,type=rsa-pem \
         --registry ${REGISTRY_ID} --log-level=debug
done

# download root ca certificates for use in mqtt client communicated with iot server.
# download using curl: curl -o roots.pem https://pki.goog/roots.pem
wget https://pki.goog/roots.pem --no-check-certificate
```

### Complete! Try the demo system in colab or locally.
If you want to use colab, visit https://colab.research.google.com/ and you can import our notebooks either directly from Github or upload from your cloned repository. Follow the instructions in the notebooks and you should be able to reproduce our results.

If you want to run the demo locally:
```
cd notebook
virtualenv env
source env/bin/activate
pip install jupyter
jupyter notebook
```

*notebook/EnergyDisaggregationDemo_View.ipynb* allows you to view raw power consumption data and our model's prediction results in almost real time. It pulls data from our server's pubsub topic for visualization. Fill in the necessary information in the *Configuration* block and run all the cells.

*notebook/EnergyDisaggregationDemo_Client.ipynb* simulates multiple smart meters by reading in power consumption data from a real world dataset and sends the readings to our server. All Cloud IoT Core related code resides in this notebook. Fill in the necessary information in the *Configuration* block and run all the cells, once you see messages being sent you should be able to see plots like the one shown below in *notebook/EnergyDisaggregationDemo_View.ipynb*.

![Demo system sample output](./img/demo03.gif)


