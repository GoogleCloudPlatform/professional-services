<!---
  Copyright 2019 Google LLC.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->

# Data preparation tool for machine learning

The tool is aiming to make a train/validation split for the machine learning dataset stored in [BigQuery](https://cloud.google.com/bigquery/). The goal is to have an output in form of .csv files in a [Google Cloud Storage](https://cloud.google.com/products/storage/) bucket.

## Tool description

There are few phases in which the data is being processed:
* Reading data from the BigQuery source table.
* Shuffling the data and copying it to a temporary BigQuery table in the destination dataset.
* Splitting the temporary table into two: training and validation tables.
* Exporting the training and validation data to the corresponding .csv files in the destination GCS bucket.

In addition to just moving and splitting the data you can limit the data by specifying columns you want to move and also generate new features by using SQL syntax. User can also specify parameters for dynamic column names and a specific train/validation set split ratio.

To make it happened there are several parameters that have to be set when running the code:

| Parameter name | Description | Is Required |
| -------------- | ----------- | ----------- |
| source_project | GCP project from where to extract the data | Y |
| source_dataset | BigQuery dataset from where to extract the data | Y |
| source_table   | BigQuery table from where to extract the data | Y |
| destination_project  | GCP project where to save the intermediary data | Y |
| destination_dataset  | BigQuery dataset where to save the intermediary data | Y |
| destination_gcs_path | Google Cloud Storage where to export the training and validation data in CSV format | Y |
| parameters  | Columns parameters that should be replaced in the column names | N |
| split_ratio | Split ratio for the train/validation split | N |

The code is divided into several modules that serve different purposes:
* The [ml_dataprep.config](ml_dataprep/config.py) module is the place where user should specify the features and target values to be extracted by defining the *COLUMNS*, *TARGET_COLUMNS_SHUFFLE* and *TARGET_COLUMNS_EXPORT* arrays.
* Several queries defined in the [ml_dataprep.queries](ml_dataprep/queries.py) module that are used for shuffling and splitting the data.
* The [ml_dataprep.bigquery](ml_dataprep/bigquery.py) module is used to connect to and use the capabilities of BigQuery.
* The processing logic is defined in the [ml_dataprep.dataprep](ml_dataprep/dataprep.py) module. Using the above modules it implements the creation of the temporary tables, the data movement and export.
* The code can be run using the [ml_dataprep.runner](ml_dataprep/runner.py) module as shown below.

## Prerequisites

This code requires Python, preferably using the 3.x stable version. You can download and install Python at the following address: [https://www.python.org/downloads/](https://www.python.org/downloads/). The [requirements.txt](requirements.txt) file contains the modules needed to run. You can install the required packages using the following command:

```
pip install -r requirements.txt
```

In order to run the tool successfully you also need the [Google Cloud SDK](https://cloud.google.com/sdk/install) and a [Google Cloud project](https://cloud.google.com/resource-manager/docs/creating-managing-projects) that will contain the destination BigQuery dataset and GCS storage bucket. This project is then used as a *destination_project* parameter. Similarly you need a [BigQuery dataset](https://cloud.google.com/bigquery/docs/datasets) and a [Google Cloud Storage bucket](https://cloud.google.com/storage/docs/creating-buckets) which will further be used as *destination_dataset* and *destination_gcs_path* parameters respectively.

The next step is to authorize the *gcloud* tools using your credentials and set up environment properties. You can do it using the following [command](https://cloud.google.com/sdk/gcloud/reference/init):
```
gcloud init
```
You should set the environment to use the destination project.

Make sure you have the access rights required to read the data from the BigQuery source table.

## Using the tool

This section will describe how to make the default configuration working. Then it will guide you to adjust it to your specific use case. The input is the source of the data in BigQuery. The output is the training and validation datasets saved in BigQuery tables and Google Cloud Storage files.

The inputs of the tool are the following:
* Source BigQuery project, dataset and table - provided as parameters to the script.
* Destination BigQuery project and datasets - provided as parameters to the script.
* Destination Cloud Storage path - passed as a parameter to the script.
* Columns related parameters (column names, SQL transformations, target columns) - configured in the [ml_dataprep.config](ml_dataprep/config.py) module.
* Split ratio between training and validation data - optional parameter passed to the script.
* Column names parameters - optional parameter passed to the script.

The result of the script execution is:
* Two BigQuery tables containing training and validation data named *\<source_table_name\>\_training\_\<timestamp\>* and *\<source_table_name\>\_validation\_\<timestamp\>* respectively located in the *\<destination_project\>.\<destination_dataset\>* dataset
* A Cloud Storage folder named *\<source_table_name\>\_\<timestamp\>* located in *\<cloud_storage_path\>* containing the training and validation data files located
* Training data files named *training\_\<index\>.csv* located in the above mentioned folder
* Validation data files named *validation\_\<index\>.csv* located in the above mentioned folder

Depending on the size of the source table more than one file for both the training and validation datasets can be create.

### Running the default

The default tool configuration allows you to experiment using one of the [public BigQuery datasets](https://cloud.google.com/bigquery/public-data/) from the [International Census Data](https://console.cloud.google.com/bigquery?p=bigquery-public-data&d=census_bureau_international). We used the *age_specific_fertility_rates* table of this dataset.

To make the example work and generate the training and validation data in your project, you need to fill in the [run.sh](run.sh) script your Google Cloud project id, BigQuery dataset name, and path to the Google Cloud Storage bucket. Running the script will create temporary tables in your BigQuery dataset and corresponding .csv files containing the training and validation datasets.

For example if your destination project ID is *my_bq_project*, your dataset name is *my_census* and the path to the bucket is *gs://my_ages_ratios*, the *run.sh* will look like this:

```
python -m ml_dataprep.runner \
	--parameters 15_19 20_24 25_29 30_34 35_39 40_44 45_49 \
	--source_project=bigquery-public-data \
	--source_dataset=census_bureau_international \
	--source_table=age_specific_fertility_rates \
	--destination_project=my_bq_project \
	--destination_dataset=my_census \
	--destination_gcs_path=gs://my_ages_ratios
```

After running the script you will find the training and validation datasets in the following BigQuery tables:
* my_bq_project.my_census.age_specific_fertility_rates\_training\_\<timestamp\>
* my_bq_project.my_census.age_specific_fertility_rates\_validation\_\<timestamp\>

The training and validation datasets will also be present in the following Cloud Storage files:
* gs://my_ages_ratios/age_specific_fertility_rates\_\<timestamp\>/training_000000000000.csv
* gs://my_ages_ratios/age_specific_fertility_rates\_\<timestamp\>/validation_000000000000.csv

## Running your example

Starting from the default tool configuration, to change the BigQuery source you need to provide the *source_project*, *source_dataset* and *source_table* parameters in the [run.sh](run.sh) file.

**IMPORTANT** Changing the source data would mean the table structure (and hence columns) will be different. You will need to specify the following variables in the [ml_dataprep.config](ml_dataprep/config.py) module:
* *COLUMNS* - array of column names that you want to be in the final dataset unchanged.
* *TARGET_COLUMNS_SHUFFLE* - array of the column names that would be regarded as target values in the machine learning training; as per the default example you, can create additional target columns as SQL combinations of source columns and naming them.
* *TARGET_COLUMNS_EXPORT* - array of the target column names that would be copied to the final train/validation split.

All arrays can contain parameterized names. Column names parameters can be set up using *parameters* when running the *run.sh* script. All columns can also be specified directly or as constructed ones using SQL syntax. However it is recommended that *TARGET_COLUMNS_EXPORT* uses the names of the columns as they were defined in *TARGET_COLUMNS_SHUFFLE*.
