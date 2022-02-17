# Instrumenting Web Applications End-to-End with Stackdriver and OpenTelemetry

This tutorial demonstrates instrumenting a web application end-to-end, from the
browser to the backend application, including logging, monitoring, and tracing
with OpenTelemetry and Stackdriver to run for a load test. It shows how to
collect the instrumentation data from the browser and the server, ship to
Stackdriver, export to BigQuery, and analyze the logs with SQL queries.
The app is something like a simple web version of Apache Bench. It includes
JavaScript browser code that drives HTTP requests to a Node.js backend that
can be run anywhere that you can run Node.

## Setup

To work through this example, you will need a GCP project. Follow these steps
1. [Select or create a GCP project](https://console.cloud.google.com/projectselector2/home/dashboard)
2. [Enable billing for your project](https://support.google.com/cloud/answer/6293499#enable-billing)
3. Clone the repo
git clone https://github.com/GoogleCloudPlatform/professional-services.git
4. Install Node.js
5. Install Go
6. Install Docker
7. Install the [Google Cloud SDK](https://cloud.google.com/sdk/install)

Clone this repository to your environment with the command

```shell
git clone https://github.com/GoogleCloudPlatform/professional-services.git
```

Change to this directory and set an environment variable to remember the
location

```shell
cd professional-services/examples/web-instrumentation
WI_HOME=`pwd`
```

Set Google Cloud SDK to the current project

```shell
export GOOGLE_CLOUD_PROJECT=[Your project]
gcloud config set project $GOOGLE_CLOUD_PROJECT
```

Enable the required services

```shell
gcloud services enable bigquery.googleapis.com \
  cloudbuild.googleapis.com \
  cloudtrace.googleapis.com \
  compute.googleapis.com \
  container.googleapis.com \
  containerregistry.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com
```


Install the JavaScript packages required by both the server and the browser:

```shell
npm install
```

## OpenTelemetry collector

Open up a new shell. In a new directory, clone the OpenTelemetry collector
contrib project, which contains the Stackdriver exporter

```shell
git clone https://github.com/open-telemetry/opentelemetry-collector-contrib
cd opentelemetry-collector-contrib
```

Build the binary executable

```shell
make otelcontribcol
```

Build the container

```shell
make docker-otelcontribcol
```

Tag it for Google Container Registry (GCR)

```shell
docker tag otelcontribcol gcr.io/$GOOGLE_CLOUD_PROJECT/otelcontribcol:latest
```

Push to GCR

```shell
docker push gcr.io/$GOOGLE_CLOUD_PROJECT/otelcontribcol
```

### Run the OpenTelemetry collector locally

If you are running on GKE only, you do do not need to do this step.
For running locally, the OpenTelemetry collector needs permissions and
credentials to write to Stackdriver.

Obtain user access credentials and store them for Application Default
Credentials

```shell
gcloud auth application-default login \
  --scopes="https://www.googleapis.com/auth/trace.append"
```

Install Go and run **This bit is not working for OT**

```shell
make otelcontribcol
bin/linux/otelcontribcol --config=$WI_HOME/conf/otservice-config.yaml
```

## Browser code

The browser code refers to ES2015 modules that need to be transpiled and bundled
with the help of webpack. Make sure that the variable `agentURL` in
`src\index.js` refers to localhost if running the OpenCensus agent locally or to
the external IP of the OpenCensus agent if running on Kubernetes.

In the original terminal, change to the browser code directory

```shell
cd browser
```

Install the browser dependencies

```shell
npm install
```

Compile the code

```shell
npm run build
```

## Run app locally

The app can be deployed locally. First change to the top level directory

```shell
cd ..
```

To run the app locally type

```shell
node ./src/app.js
```

Open your browser at http://localhost:8080

Fill in the test form to generate some load. You should see logs from both the
Node.js server and the browser code in the console. You should see traces in
Stackdriver.

## Deploy to Kubernetes

Create a cluster with 1 node and cluster autoscaling enabled

```shell
ZONE=us-central1-a
NAME=web-instrumentation
CHANNEL=regular # choose rapid if you want to live on the edge
gcloud beta container clusters create $NAME \
   --num-nodes 1 \
   --enable-autoscaling --min-nodes 1 --max-nodes 4 \
   --enable-basic-auth \
   --issue-client-certificate \
   --release-channel $CHANNEL \
   --zone $ZONE \
   --enable-stackdriver-kubernetes
```

Change the project id in file `k8s/ot-service.yaml` with the sed command

```shell
sed -i.bak "s/{{PROJECT-ID}}/$GOOGLE_CLOUD_PROJECT/" k8s/ot-service.yaml
```

Deploy the OpenTelemetry service to the Kubernetes cluster

```shell
kubectl apply -f k8s/ot-service.yaml
```

Get the external IP. It might take a few minutes for the deployment to complete
and an IP address be allocated. You may have to execute the command below
several times before the EXTERNAL_IP shell variable is successfully set.

```shell
EXTERNAL_IP=$(kubectl get svc ot-service-service \
    -o jsonpath="{.status.loadBalancer.ingress[*].ip}")
echo "External IP: $EXTERNAL_IP"
```

Edit the file `browser/src/index.js` changing the variable `collectorURL` to
refer to the external IP and port (80) of the agent with the following sed
command

```shell
sed -i.bak "s/localhost:55678/${EXTERNAL_IP}:80/" browser/src/index.js
```

Rebuild the web client

```shell
cd browser
npm run build
cd ..
```

### Build the app image

To deploy the image to the Google Container Registry (GCR), use the following
Cloud Build command

```shell
gcloud builds submit
```

Change the project id in file `k8s/deployment.yaml` with the sed command

```shell
sed -i.bak "s/{{PROJECT-ID}}/$GOOGLE_CLOUD_PROJECT/" k8s/deployment.yaml
```

Deploy the app

```shell
kubectl apply -f k8s/deployment.yaml
```

Configure a service

```shell
kubectl apply -f k8s/service.yaml
```

Expose a service:

```shell
kubectl apply -f k8s/ingress.yaml
```

Check for the external IP

```shell
kubectl get ingress
```

It may take a few minutes for the service to be exposed through an external IP.

Navigate to the external IP. It should present a form that will allow you to
send a series of XML HTTP requests to the server. That will generate trace and
monitoring data.

## Log exports

Before running tests, consider first setting up
[log exports](https://cloud.google.com/logging/docs/export).
to BigQuery for more targeted log queries to analyse the results of your load
tests or production issues.

Create a BQ dataset to export the container logs to

```shell
bq --location=US mk -d \
  --description "Web instrumentation container log exports" \
  --project_id $GOOGLE_CLOUD_PROJECT \
  web_instr_container
```

Create a log export for the container logs

```shell
LOG_SA=$(gcloud logging sinks create web-instr-container-logs \
  bigquery.googleapis.com/projects/$GOOGLE_CLOUD_PROJECT/datasets/web_instr_container \
  --log-filter='resource.type="k8s_container" AND labels.k8s-pod/app="web-instrumentation"' \
  --format='value("writerIdentity")')
```

The identify of the logs writer service account is captured in the shell
variable `LOG_SA`. Give this service account write access to BigQuery

```shell
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
    --member $LOG_SA \
    --role roles/bigquery.dataEditor
```

Create a BQ dataset for the load balancer logs

```shell
bq --location=US mk -d \
  --description "Web instrumentation load balancer log exports" \
  --project_id $GOOGLE_CLOUD_PROJECT \
  web_instr_load_balancer
```

Repeat creation of the log sink for load balancer logs

```shell
LOG_SA=$(gcloud logging sinks create web-instr-load-balancer-logs \
  bigquery.googleapis.com/projects/$GOOGLE_CLOUD_PROJECT/datasets/web_instr_load_balancer \
  --log-filter='resource.type="http_load_balancer"' \
  --format='value("writerIdentity")')
```

Note that the service account id changes so that you need to note that anre
repeat the step for granting write access BigQuery

```shell
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
  --member $LOG_SA \
  --role roles/bigquery.dataEditor
```

## Running the load test

Now you are ready to run the load test. You might try opening two tabs in a
browser. In one tab generate a steady state load with request of say, 1 second
apart, to give a baseline. Then hit the app with a sudden spike to see how it
responds.

You can send a request from the command line with cURL

```shell
EXTERNAL_IP=[from kubectl get ingress command]
REQUEST_ID=1234567889 # A random number
# See W3C Trace Context for format
TRACE=00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
MILLIS=`date +%s%N | cut -b1-13`
curl "http://$EXTERNAL_IP/data/$REQUEST_ID" \
  -H "traceparent: $TRACE" \
  -H 'Content-Type: application/json' \
  --data-binary "{\"data\":{\"name\":\"Smoke test\",\"reqId\":$REQUEST_ID,\"tSent\":$MILLIS}}"
```

Check that you see the log for the request in the Log Viewer. After the log is
replicated to BigQuery, you should be able to query it with a query like below.
Note that the table name will be something like `requests_20200129`. A shell
variable is used to set the date below.

```shell
DATE=$(date -u +'%Y%m%d')
bq query --use_legacy_sql=false \
"SELECT
  httpRequest.status,
  httpRequest.requestUrl,
  timestamp
FROM web_instr_load_balancer.requests_${DATE}
ORDER BY timestamp DESC
LIMIT 10"
```

There are more queries in the Colab sheet
[load_test_analysis.ipynb](https://colab.research.google.com/github/googlecolab/GoogleCloudPlatform/professional-services/blob/web-instrumentation/examples/web-instrumentation/load_test_analysis.ipynb).

## Troubleshooting

Try the following, depending on where you encounter problems.

### Check project id

Check that you have set your project id in files `k8s/oc-service.yaml`,
`conf\ocagent-config.yaml`, and `deployment.yaml`.

### Tracing issues
You can use zPages to see the trace data sent to the OC agent. Find the
name of the POD running the agent:

```shell
kubectl get pods
```

Start port forwarding

```shell
kubectl port-forward $POD 55679:55679
```

Browse to the URL http://localhost:55679/debug/tracez

### Browser JavaScript
For trouble bundling the web client, see Webpack
[Getting Started](https://webpack.js.org/guides/getting-started/).
