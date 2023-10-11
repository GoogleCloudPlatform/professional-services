
# Cloud Storage to BigQuery using Cloud Composer 
End-to-end sample example to do data extraction from Cloud Storage to BigQuery using Composer.git

* Cloud Storage to BigQuery
* With Airflow operator [BigQueryInsertJobOperator](https://airflow.apache.org/docs/apache-airflow-providers-google/stable/_modules/tests/system/providers/google/cloud/bigquery/example_bigquery_queries.html) loads data into BigQuery.

## Pre requisites:
1. Cloud Composer instance setup
2. Cloud Sotrage bucket needs to created
3. BigQuery API enabled

# Repo Structure:
```
.
├── README.md
└── data-ingestion
    ├── asset
    │   └── dag_image.png
    ├── cloudbuild.yaml
    ├── dags
    │   └── common_layer.py
    ├── data
    │   └── common_layer
    │       └── config
    │           ├── common_layer_config_defaults.yml
    │           └── common_layer_config_ingestion_demo.yml
    └── plugins
        └── includes
            ├── entities.py
            ├── exceptions.py
            ├── loggers.py
            └── utils.py
```
# Steps to run this framework:
1. Place a file in the landing bucket location in Google Cloud Storage and update the configuration file accordingly.
2. The DAG (Directed Acyclic Graph) will be triggered, the file is picked up by the GCS sensor, and it will begin loading the data into the BigQuery table.
3. Please refer to the screenshot below to see how the DAG appears during execution:
<image src="data-ingestion/asset/dag_image.png" width=450>
4. In the configuration file, enter your project and cloud storage bucket details, as shown in the highlighted section below.
<image src="data-ingestion/asset/config.png" width=450>
