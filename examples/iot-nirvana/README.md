# IoT Nirvana

This solution was built with the purpose of demonstrating an end-to-end
Internet of Things architecture running on Google Cloud Platform. The purpose of
the solution is to simulate the collection of temperature measures from sensors
distributed all over the world and to follow temperature evolution by city in
real time. This document will guide you through the necessary steps to set up
the entire solution on Google Cloud Platform (GCP).

## Architecture

The image below contains a high level diagram of the solution.
![](img/architecture.png)

The following components are represented on the diagram:

1. Temperature sensors are simulated by running IoT Java clients on Google Compute
   Engine
2. The sensors send temperature data to an IoT Core registry running on GCP
3. The IoT Core registry publishes it into a PubSub topic
4. A streaming Dataflow pipeline is capturing the temperature data in real time
   by subscribing to and reading from the PubSub topic
5. Temperature data is pushed into BigQuery for analytics purposes
6. Temperature data is also saved to Datastore for real time querying
7. Temperature is displayed in real time in a Web AppEngine application
8. All components are logging data to Stackdriver

## Bootstrapping

As a pre-requisite you will need a GCP project to which you have owner rights
in order to facilitate the setup of the solution. In the remainder of this guide
this project's identifier will be referred to as **[PROJECT_ID]**.

Enable the following APIs in your project:

* [Cloud Pub/Sub API](https://console.cloud.google.com/apis/api/pubsub.googleapis.com)
* [DataFlow API](https://console.cloud.google.com/apis/api/dataflow.googleapis.com)
* [Google Cloud IoT API](https://console.cloud.google.com/apis/library/cloudiot.googleapis.com)

In order to run the simulation in ideal conditions, with 10 virtual machines,
please request an increase of your CPU quota to 80 vCPU. This is however
optional.

Create the environment variables that will be used throughout this tutorial. You can edit the default values provided below, however please note that not all products may be available in all regions:

```
export PROJECT_ID=<PROJECT_ID>
export BUCKET_NAME=<BUCKET_NAME>
export REGION=us-central1
export ZONE=us-central1-a
export PUBSUB_TOPIC=telemetry
export PUBSUB_SUBSCRIPTION=telemetry-sub
export IOT_REGISTRY=devices
export BIGQUERY_DATASET=warehouse
export BIGQUERY_TABLE=device_data
```
Run the **setup_gcp_environment.sh** script with the following parameters, in
this order, to create the corresponding resources in your GCP project:

Following arguments must be provided:

    1) Project Id
    2) Region where the Cloud IoT Core registry will be created
    3) Zone where a temporary VM to generate the Java image will be created
    4) Cloud IoT Core registry name
    5) PubSub telemetry topic name
    6) PubSub subscription name
    7) BigQuery dataset name

In addition, the script also creates an Debian image with Java pre-installed,
called **debian9-java8-img** that will be used to run the Java programs
simulating temperature sensors.

Example:

`setup_gcp_environment.sh $PROJECT_ID $REGION $ZONE $IOT_REGISTRY $PUBSUB_TOPIC $PUBSUB_SUBSCRIPTION  $BIGQUERY_DATASET`

## Build the solution

The first action is to compile and package all the modules of the solution: the
client simulating the temperature sensor, the Dataflow pipeline and the frontend
AppEngine application displaying temperatures in real time. To to this, run the
following command at the root of the project:

`mvn clean install`

## Dataflow pipeline

In order to run the Dataflow pipeline execute the `run_oncloud.sh` script at the
root of the project with the following parameters:

* **[PROJECT_ID]** - your project's identifier
* **[BUCKET_NAME]** - the name of the bucket created by the bootstrapping
  script, identical to your project's identifier, **[PROJECT_ID]**, where the
  Dataflow pipeline's binary package will be stored
* **[PUBSUB_TOPIC]** - the name of the PubSub topic created by the bootstrapping
  script, from which the Dataflow pipeline will read the temperature data;
  please note that this isn't the topic's canonical name, but instead the name
  relative to your project
* **[BIGQUERY_TABLE]** - a name for the BigQuery table where Dataflow will save
  the temperature data; the format of this parameter must follow the rule
  **[BIGQUERY_DATASET].[TABLE_NAME]**

Example:

`run_oncloud.sh $PROJECT_ID $BUCKET_NAME $PUBSUB_TOPIC $BIGQUERY_DATASET.$BIGQUERY_TABLE`

## Temperature sensor

Copy the JAR package containing the client binaries to Google Cloud Storage in
the bucket previously created. Run the following command in the `/client`
folder:

`gsutil cp target/google-cloud-demo-iot-nirvana-client-jar-with-dependencies.jar gs://$BUCKET_NAME/client/`

Check that the JAR file has been correctly copied in the Google Cloud Storage
bucket with the following command:

`gsutil ls gs://$BUCKET_NAME/client/google-cloud-demo-iot-nirvana-client-jar-with-dependencies.jar`

## AppEngine Web frontend

The following steps will allow you to set up and run on AppEngine the Web
frontend that allows to visualize in real time the temperature data captured
from the temperature sensors:
1. Modify the `src/main/webapp/startup.sh`file in the `/app-engine` folder by
   updating the variables below. This is the startup script of the Virtual
   Machines that will be created from the image **debian9-java8-img** and it
   creates 10 instances of the Java client simulating a temperature sensor.
   * PROJECT_ID - your GCP project's identifier, **[PROJECT_ID]**
   * BUCKET_NAME - name of the Google Cloud Storage bucket created by the
     bootstrapping script
   * REGISTRY_NAME - name of the IoT Core registry created by the bootstrapping
     script
   * REGION - region in which the IoT Core registry was created by the
     bootstrapping script
2. Copy the `startup.sh` file in the Google Cloud Storage bucket by running the
   following command in the `/app-engine` folder:
   `gsutil cp src/main/webapp/startup.sh gs://$BUCKET_NAME/`
3. Modify the `/pom.xml` file in the `/app-engine` folder:
   * Update the `<app.id/>` node with the **[PROJECT_ID]** of your GCP project
   * Update the `<app.version/>` with the desired version of the application
4. Modify the `src/main/webapp/config/client.properties` file in the
   `/app-engine` folder by updating the values of the following parameters:
   * GCS_BUCKET- name of the Google Cloud Storage bucket created by the
     bootstrapping script
   * GCE_METADATA_STARTUP_VALUE - path on Google Cloud Storage to the startup
     script edited at the previous step, gs://[BUCKET_NAME]/startup.sh
   * GCP_CLOUD_IOT_CORE_REGISTRY_NAME - name of the IoT Core registry created by
     the bootstrapping script
   * GCP_CLOUD_IOT_CORE_REGION - region in which the IoT Core registry was
     created by the bootstrapping script
5. Enable the [Maps Javascript API](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com)
6. In the *Credentials* section of the Maps Javascript API generate the API key
   that will be used by the Web frontend to call Google Maps. This key will be
   referred to as **[MAPS_API_KEY]** further in the document. Make sure to:
   * Select HTTP in the "Application restrictions" list
   * Enter the URLs of the application, `https://[YOUR_PROJECT_ID].appspot.com/*`
     and `http://[YOUR_PROJECT_ID].appspot.com/*`, in the "Accept requests for
     these HTTP referrers (web sites)" input zone
7. Update the `src/main/webapp/index.html` file in the `/app-engine` folder by
   replacing the **[MAPS_API_KEY]** text with the actual value of the Google
   Maps API key generated at step 2.
8. Run the `gcloud app create` command to create the Google AppEngine
   application
9. Deploy the frontend Web application on AppEngine by running the following
   command in the at the root of the project:
   `mvn -pl app-engine appengine:update`

## Testing

In order to test the end to end solution, it is necessary first to start the
temperature sensors simulation. Follow the steps below to achieve this:

* Go to the following address in your web browser, which will display the map
  of the Earth with 3 buttons at the bottom: **Start**, **Update**, **Stop**
  `https://[YOUR_PROJECT_ID].appspot.com/index.html`
* Click on the **Start** button at the bottom left of the page (this also
  enables the buttons **Update** and **Stop**)
* The VM instances being launched are visible in the Google Cloud Console under
  [Compute Engine](https://console.cloud.google.com/compute/instances)

In order to visualize temperature data in real time on Google Maps do the
following:

* Click on the **Update** button at the bottom center of the page
  `https://[YOUR_PROJECT_ID].appspot.com/index.html`. This will display on the
  map test cities used for simulating the temperature sensors.
* Run the following SQL query in BigQuery to retrieve the most recent cities for
  which data is available:
  `SELECT City, Time FROM ``[BIGQUERY_DATASET].[TABLE_NAME]`` ORDER BY 2 DESC LIMIT 10`
* Locate on the map one of the cities returned by the query and click on the
  city icon to visualise the temperatures graph.

To stop the simulation click on the **Stop** button at the bottom right of the
page `https://[YOUR_PROJECT_ID].appspot.com/index.html`.

