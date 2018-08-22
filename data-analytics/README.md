# Data analytics
This is a repository of data and analytics solutions.  

## Python Dataflow examples
The [Dataflow python examples](dataflow-python-examples/README.md) contain several end to end examples demonstrating 
the Dataflow Python API.  The examples are solutions to common use cases we see in the field.

The solutions below become more complex as we incorporate more Dataflow features.

## Cloud Composer examples
The [Cloud Composer examples](cloud-composer-examples/README.md) contains an end to end example demonstrating the use
of a Cloud Composer workflow to run a Cloud Dataflow job. The example uses Cloud Function to trigger the workflow.

## Cloud Dataflow - Elasticsearch Indexer example
The [Dataflow Elasticsearch Indexer](dataflow-elasticsearch-indexer/README.md) contains an example pipeline that demonstrates the process of reading JSON documents from Cloud Pub/Sub, enhancing the document using metadata stored in Cloud Bigtable and indexing those documents into [Elasticsearch](https://www.elastic.co/). The pipeline also validates the documents for correctness and availability of metadata and publishes any documents that fail validation into another Cloud PubSub topic for debugging and eventual reprocessing.

