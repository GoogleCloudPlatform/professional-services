## Indexing documents into Elasticsearch using Cloud Dataflow
This example Cloud Dataflow pipeline demonstrates the process of reading JSON documents from Cloud Pub/Sub, enhancing the document using metadata stored in Cloud Bigtable and indexing those documents into [Elasticsearch](https://www.elastic.co/). The pipeline also validates the documents for correctness and availability of metadata and publishes any documents that fail validation into another Cloud Pub/Sub topic for debugging and eventual reprocessing.

### Workflow Overview

***

<img src="img/dataflow_elastic_workflow.png" alt="Workflow Overview" height="400" width="800"/>

At a high-level the Cloud Dataflow pipeline performs the following steps:
1. Reads JSON documents from Cloud Pub/Sub, validates that the documents are well-formed and contains a user provided unique id field (e.g. **SKU**).
2. Enhances the document using external metadata stored in a Cloud Bigtable table. The pipeline looks up the metadata from Cloud Bigtable using the unique id field (e.g. **SKU**) extracted from the document.
3. Indexes the enhanced document into an existing Elasticsearch index.
4. Publishes into a Cloud Pub/Sub topic, any documents that either fail validation (i.e. are not well-formed JSON documents) or do not have a metadata record in Cloud Bigtable.
5. Optionally corrects and republishes the failed documents back into Cloud Pub/Sub. *Note: This workflow is not part of the sample code provided in this repo*.

#### Sample Data
For the purpose of demonstrating this pipeline, we will use the [products](https://github.com/BestBuyAPIs/open-data-set/blob/master/products.json) data provided [here](https://github.com/BestBuyAPIs/open-data-set). The products data provides JSON documents with various attributes associated with a product:
```json
{
                    "image": "http://img.bbystatic.com/BestBuy_US/images/products/4853/48530_sa.jpg",
                    "shipping": 5.49,
                    "price": 5.49,
                    "name": "Duracell - AA 1.5V CopperTop Batteries (4-Pack)",
                    "upc": "041333415017",
                    "description": "Long-lasting energy; DURALOCK Power Preserve technology; for toys, clocks, radios, games, remotes, PDAs and more",
                    "model": "MN1500B4Z",
                    "sku": 48530,
                    "type": "HardGood",
                    "category": [
                        {
                            "name": "Connected Home & Housewares",
                            "id": "pcmcat312300050015"
                        },
                        {
                            "name": "Housewares",
                            "id": "pcmcat248700050021"
                        },
                        {
                            "name": "Household Batteries",
                            "id": "pcmcat303600050001"
                        },
                        {
                            "name": "Alkaline Batteries",
                            "id": "abcat0208002"
                        }
                    ],
                    "url": "http://www.bestbuy.com/site/duracell-aa-1-5v-coppertop-batteries-4-pack/48530.p?id=1099385268988&skuId=48530&cmp=RMXCC",
                    "manufacturer": "Duracell"
                }
```

#### Sample metadata
In order to demonstrate how the documents are enhanced using external metadata stored in Cloud Bigtable, we will create a Cloud Bigtable table (e.g. *products_metadata*) with a single column family (e.g. *cf*). A randomly generated *boolean* value is then stored for a field called **in_stock** associated with the **SKU** that is used as a *rowkey*:

|rowkey      |in_stock    |
|:-----------|:-----------|
|1234	       |true        |
|5678	       |false       |
|....	       |....        |

#### Generating sample data and metadata.
In order to assist with publishing the products data into Cloud Pub/Sub and populating the metadata table in Cloud Bigtable, we provided a helper pipeline [Publish Products](ElasticIndexer/src/main/java/com/google/cloud/pso/utils/PublishProducts.java).
The sample pipeline can be executed from the folder containing the [pom.xml](ElasticIndexer/pom.xml) file:
```bash
mvn compile exec:java -Dexec.mainClass=com.google.cloud.pso.utils.PublishProducts -Dexec.args=" \
--runner=DataflowRunner \
--project=[GCP_PROJECT_ID] \
--stagingLocation=[GCS_STAGING_BUCKET] \
--input=[GCS_BUCKET_CONTAINING_PRODUCTS_FILE]/products.json.gz \
--topic=[INPUT_Pub/Sub_TOPIC] \
--idField=/sku \
--instanceId=[BIGTABLE_INSTANCE_ID] \
--tableName=[BIGTABLE_TABLE_NAME] \
--columnFamily=[BIGTABLE_COLUMN_FAMILY] \
--columnQualifier=[BIGTABLE_COLUMN_QUALIFIER]"
```
<img src="img/sample_data_gen_pipeline.png" alt="Sample data generation workflow" height="864" width="800"/>

***

#### Setup and Pre-requisites
The sample pipeline is written in Java and requires Java 8 and [Apache Maven](https://maven.apache.org/).

The following high-level steps describe the setup needed to run this example:

1. Create a Cloud Pub/Sub topic and subscription for consuming the documents to be indexed.
2. Create a Cloud Pub/Sub topic and subscription for publising the invalid documents.
3. Create a Cloud Bigtable table to store the metadata. The metadata can be stored in a single column family (for e.g. *cf*).
4. Identify the following relevant fields for the existing Elasticsearch index where the documents will be published.

| Field                  | Value                                          |Example                                   |
| :--------------------- |:---------------------------------------------- |:---------------------------              |
| addresses              | *comma-separated-es-addresses*                 |http://x.x.x.x:9200                       |
| index                  | *es-index-name*                                |prod_index                                |
| type                   | *es-index-type*                                |prod                                      |

5. Generate sample data and metadata using the helper pipeline as described earlier.

##### Build and Execute
The sample pipeline can be executed from the folder containing the [pom.xml](ElasticIndexer/pom.xml) file:
```bash
mvn compile exec:java -Dexec.mainClass=com.google.cloud.pso.IndexerMain -Dexec.args=" \
--runner=DataflowRunner \
--project=[GCP_PROJECT_ID] \
--stagingLocation=[GCS_STAGING_BUCKET] \
--inputSubscription=[INPUT_Pub/Sub_SUBSCRIPTION] \
--idField=[DOC_ID_FIELD] \
--addresses=[ES_ADDRESSES] \
--index=[ES_INDEX_NAME] \
--type=[ES_INDEX_TYPE] \
--rejectionTopic=[Pub/Sub_REJECTED_DOCS_TOPIC] \
--instanceId=[BIGTABLE_INSTANCE_ID] \
--tableName=[BIGTABLE_TABLE_NAME] \
--columnFamily=[BIGTABLE_COLUMN_FAMILY] \
--columnQualifier=[BIGTABLE_COLUMN_QUALIFIER]"
```

***

##### Full code examples

Ready to dive deeper? Check out the complete code [here](ElasticIndexer/src/main/java/com/google/cloud/pso/IndexerMain.java)

