# Dataflow PubSub BigTable Example

This is a sample data pipeline using Cloud PubSub, Dataflow and Cloud Bigtable.

The example scenario is a on-premise hypervisor pool which sends physical host metrics and guest VM metrics to PubSub for storage and indexing in Cloud Bigtable.

A Dataflow pipeline consumes the protobuf encoded messages from PubSub and writes to Bigtable. A command-line utility is included which can be used to check the queue depth on the PubSub subscription.

The example includes a command-line utility to generate and publish test metrics messages and two sample web applications that query Cloud Bigtable to retrieve results of a top N query. In the hypothetical scenario, the top N instances with highest load retrieved by the query would become targets for migration.

Both web applications perform the same function; the purpose of providing two is to show usage of the Bigtable client library from Python and from Java/Scala.


## Project Structure

The data generate is located at [src/main/scala/com/google/cloud/example/CloudPublish.scala](src/main/scala/com/google/cloud/example/CloudPublish.scala)

The python flask application is located at [src/main/py](src/main/py/query.py) and has a separate [README](src/main/py/README.md).

The Scala web application is located at [src/main/scala/com/google/cloud/example/CloudServlet.scala](src/main/scala/com/google/cloud/example/CloudServlet.scala).

The PubSub Queue Depth utility is located at [src/main/scala/com/google/cloud/example/QueueDepth.scala](src/main/scala/com/google/cloud/example/QueueDepth.scala)

The Apache Beam pipeline is located at [src/main/scala/com/google/cloud/example/CloudPipeline.scala](src/main/scala/com/google/cloud/example/CloudPipeline.scala)

There is an example protobuf message definition located at [proto/instancemetric.proto](proto/instancemetric.proto)


## Usage

### Variables

To set up your environment, you'll need to set some variables.
Modify the lines below before running them in your shell.

```sh
export PROJECT=myproject
export NETWORK=default
export REGION=us-east1
export SUBNET=default
export TOPIC=metrics
export SUBSCRIPTION=metrics
export INSTANCE=metrics
export TABLE=metrics
export FAMILY=metrics
export COLUMN=metrics
export SERVICEACCOUNT=metrics@$PROJECT.iam.gserviceaccount.com
export BUCKET=mybucket
```

### Building

```sh
sbt assembly
```

#### Bigtable setup

Install cbt

```sh
gcloud components update
gcloud components install cbt
```

Configure cbt
```sh
cat <<EOF> ~/.cbtrc
project = $PROJECT
instance = $INSTANCE
EOF
```

Create table

```sh
cbt deletetable $TABLE
cbt ls
cbt createtable $TABLE families=$FAMILY
cbt ls
cbt count $TABLE
```

If table already exists:

```sh
cbt createfamily $TABLE $FAMILY
```


### Testing

Run with sbt

```sh
sbt 'runMain com.google.cloud.example.CloudPublish \
  --project=$PROJECT --topic=$TOPIC'

sbt 'runMain com.google.cloud.example.CloudServlet \
  --project=$PROJECT -i $INSTANCE -t $TABLE'

sbt 'runMain com.google.cloud.example.QueueDepth \
  --project=$PROJECT --subscription=$SUBSCRIPTION'

sbt 'runMain com.google.cloud.example.CloudPipeline \
  --subscription=$SUBSCRIPTION \
  --instanceId=$INSTANCE \
  --tableId=$TABLE \
  --columnFamily=$FAMILY \
  --column=$COLUMN \
  --project=$PROJECT \
  --serviceAccount=$SERVICEACCOUNT \
  --subnetwork=projects/$PROJECT/regions/$REGION/subnetworks/$SUBNET \
  --network=$NETWORK \
  --stagingLocation=gs://$BUCKET/staging/ \
  --tempLocation=gs://$BUCKET/temp/ \
  --usePublicIps=false \
  --runner="DataflowRunner"'
```

Servlet test

```sh
curl "http://localhost:8080/top?host=h127&dc=dc3&region=r1"
curl "http://localhost:8080/metrics?host=h127&dc=dc3&region=r1"
```


### Running the example

Publish test messages

```sh
java -cp target/scala-2.11/CloudPipeline.jar \
  com.google.cloud.example.CloudPublish \
  --project=$PROJECT --topic=$TOPIC
```

Check the queue depth to verify that your messages have been published

```sh
java -cp target/scala-2.11/CloudPipeline.jar \
  com.google.cloud.example.QueueDepth \
  --project=myproject --subscription=mysub
```

Launch the Dataflow Pipeline to consume PubSub messages

```sh
java -Xms1g -Xmx1g -cp target/scala-2.11/CloudPipeline.jar \
  com.google.cloud.example.CloudPipeline \
  --subscription=$SUBSCRIPTION \
  --instanceId=$INSTANCE \
  --tableId=$TABLE \
  --columnFamily=$FAMILY \
  --column=$COLUMN \
  --project=$PROJECT \
  --serviceAccount=$SERVICEACCOUNT \
  --subnetwork=projects/$PROJECT/regions/$REGION/subnetworks/$SUBNET \
  --network=$NETWORK \
  --stagingLocation=gs://$BUCKET/staging/ \
  --tempLocation=gs://$BUCKET/temp/ \
  --usePublicIps=false \
  --runner="DataflowRunner"
```

Start the web application

```sh
java -cp target/scala-2.11/CloudPipeline.jar \
  com.google.cloud.example.CloudServlet \
  --project=$PROJECT -i $INSTANCE -t $TABLE
```

Make a query against the web application

```sh
curl "http://localhost:8080/top?host=h127&dc=dc3&region=r1"
curl "http://localhost:8080/metrics?host=h127&dc=dc3&region=r1&limit=3"
```


## Prerequisites

* [sbt](https://www.scala-sbt.org/download.html)
* Network Access to Maven Central (to run sbt and fetch dependencies)


## Known Issues

If you are behind a corporate firewall that blocks access to Maven Central, you will not be able to build the jars or run the application. You may need to modify the build file to point to your internal Maven repository.


## License

Apache License 2.0


## Disclaimer

This is not an official Google Project.

