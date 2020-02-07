# Instrumenting Web Applications End-to-End with Stackdriver and OpenTelemetry

The app is something like a simple web version of Apache Bench. It includes
JavaScript browser code that drives HTTP requests to a Node.js backend that
can be run anywhere that you can run Node.

Create a Google Cloud Project with billing enabled. Install Node.js.
Install the Google Cloud SDK.

## Setup

Clone this repository to your environment with the command

```shell
git clone https://github.com/GoogleCloudPlatform/professional-services.git
```

Change to this directory and set an environment variable to remember the
location

```shell
cd professional-services/examples/web_instrumentation
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

## OpenTelemetry collector

Open up a new shell to clone the OpenTelemetry collector contrib project, which
contains the Stackdriver exporter

```shell
git clone https://github.com/open-telemetry/opentelemetry-collector-contrib
cd opentelemetry-collector-contrib
```

Change directories and make

```shell
make otelcontribcol
```

Build the container

```shell
make docker-otelcontribcol
```

Tag it for Google Container Registry (GCR)

```shell
docker tag otelcontribcol gcr.io/$GOOGLE_CLOUD_PROJECT/otelcontribcol:0.0.1
```

Push to GCR

```shell
docker push gcr.io/$GOOGLE_CLOUD_PROJECT/otelcontribcol
```

### Run the OpenTelemetry collector locally

If you are running on GKE only, you do do not need to do this step.
For running locally, the OpenTelemetry collector needs permissions and
credentials to write to Stackdriver. You will still be able to run the test app
without a local agent but it enables collection of spans from the web client. 

First create a service account

```shell
SA_ACCOUNT=web-instrumentation-sa
gcloud iam service-accounts create $SA_ACCOUNT \
    --description "Web instrumentation development service account" \
    --display-name "web-instrumentation-app"
```    

Next, add a role to the service account to write to Stackdriver trace

```shell
MEMBER=$SA_ACCOUNT@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
    --member serviceAccount:$MEMBER \
    --role roles/cloudtrace.agent
```

Then create a credentials key.

```shell
gcloud iam service-accounts keys create credentials.json \
  --iam-account $MEMBER
```

Keep the key safe and delete it when you are done.

See the instructions at
[Getting Started with Authentication](https://cloud.google.com/docs/authentication/getting-started)
to get a more full description of how to create a credentials key.

Install Go and run **This bit is not working for OT**

```shell
make otelcontribcol
export GOOGLE_APPLICATION_CREDENTIALS=$WI_HOME/credentials.json
export GOOGLE_CLOUD_PROJECT=[your project]
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

Install the dependencies

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

Install the server dependencies

```shell
npm install
```

Make the environment variables are available in this terminal (as well as the
terminal tha the OpenCensus agent is running in)

```shell
export GOOGLE_CLOUD_PROJECT=[project id]
export GOOGLE_APPLICATION_CREDENTIALS=credentials.json 
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
   --enable-stackdriver-kubernetes \
   --zone $ZONE \
   --enable-stackdriver-kubernetes
```

Edit the project id in file `k8s/ot-service.yaml`. Deploy the OpenTelemetry
collector to the Kubernetes cluster

```shell
kubectl apply -f k8s/ot-service.yaml
```

Check for the external IP

```shell
kubectl get services
```

Edit the file `browser\src\index.js` changing the variable `agentURL` to refer
to the external IP and port (80) of the agent. Rebuild the web client.

### Build the app image

To deploy the image to the Google Container Registry (GCR), use the following
Cloud Build command

```shell
gcloud builds submit
```

This will use the configuration file named cloudbuild.yaml to build the Docker
image, push it to the Google Cloud Image Registry, and deploy to Cloud Run.

See
[Quickstart: Build and Deploy](https://cloud.google.com/run/docs/quickstarts/build-and-deploy)
for more on running applications on Cloud Run.

Edit `k8s/deployment.yaml`, changing the project id in both places. Deploy the app

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
to BigQuery for more targetted log queries to analyse the results of your load
tests or production issues.

Create a BQ dataset for the container logs

```shell
bq --location=US mk -d \
--description "Web instrumentation container log exports" \
web_instr_container
```

Create a log export for the container logs 

```shell
gcloud logging sinks create web-instr-container-logs \
  bigquery.googleapis.com/projects/$GOOGLE_CLOUD_PROJECT/datasets/web_instr_container \
  --log-filter='resource.type="k8s_container" AND labels.k8s-pod/app="web-instrumentation"'
```

Grant logs service account write access to BigQuery

```shell
LOG_SA=[from output of previous command]
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
    --member serviceAccount:$LOG_SA \
    --role roles/bigquery.dataEditor
```

Repeat for load balancer logs. Create a BQ dataset 

```shell
bq --location=US mk -d \
--description "Web instrumentation load balancer log exports" \
web_instr_load_balancer
```

Create a log export for the container logs 

```shell
gcloud logging sinks create web-instr-load-balancer-logs \
  bigquery.googleapis.com/projects/$GOOGLE_CLOUD_PROJECT/datasets/web_instr_load_balancer \
  --log-filter='resource.type="http_load_balancer"'
```

Note that the service account id changes so that you need to note that anre 
repeat the step for granting write access BigQuery

```shell
LOG_SA=[from output of previous command]
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
    --member serviceAccount:$LOG_SA \
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
replecated to BigQuery, you should be able to query it with a query like below.
Change the table name `requests_20200129` to use the current date.

```shell
bq query --use_legacy_sql=false \
'SELECT
  httpRequest.status,
  httpRequest.requestUrl,
  timestamp
FROM `web_instr_load_balancer.requests_20200129`
ORDER BY timestamp DESC
LIMIT 10'
```

## Troubleshooting

Try the following, dendending on where you encounter problems.

### Check project id

Check that you have set your project id in files `k8s/deployment.yaml`,
`k8s/oc-agent.yaml`, `conf\ocagent-config.yaml`, and the environment variable
`GOOGLE_CLOUD_PROJECT`.

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
