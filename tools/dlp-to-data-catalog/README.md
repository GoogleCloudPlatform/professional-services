# Inspect your tables using Data Loss Prevention for PII data and automatically tag it on Data Catalog using Python #

Our objective for this asset is to provide a solution for data cataloging that is more accessible for Python users. By leveraging [Data Loss Prevention](https://cloud.google.com/dlp) in Python, we aim to simplify the process of inspecting [BigQuery](https://cloud.google.com/bigquery) and [CloudSQL](https://cloud.google.com/sql) data and creating tags, making it easier for organizations to understand and manage their data assets.

## How it works ##

To use our program, users must provide as a parameter the name of the BigQuery dataset they wish to analyze or the name of the specific table containing the data to be inspected. Our program then uses the Google Cloud DLP API to inspect the data. Once the inspection process is complete, our program creates a Data Catalog template linked to the inspected BigQuery table. This data catalog contains detailed information about the sensitive data found, including the type of data, its location, and any other relevant metadata.

To create the Data Catalog template, our program uses the Cloud Data Catalog API, which allows you to effectively tag and organize the data. By using the Data Catalog API, our program can automatically tag the sensitive data found and add additional relevant information to the data catalog.

In short, our program is a comprehensive and effective tool for protecting the privacy of an organization's data. By using the Google Cloud DLP and Data Catalog API, our program can automatically detect any sensitive data and effectively tag it in a data catalog linked to the BigQuery table. This provides greater transparency and control over sensitive data in an organization, which can help improve overall data privacy and security.

## Nested Tables Support ##

#### Support for nested tables.

We support nested tables up to 1 level. This means that you can access and query data within a nested structure that has a single level of nesting. Deeper levels of nesting may not be fully supported.

## Technical Requirements ##
These are the Google Cloud Platform services leveraged for the solution:

1. <a href= "https://cloud.google.com/dlp?hl=es-419"> Data Loss Prevention</a>
2. <a href= "https://cloud.google.com/products?hl=es-419"> Data Catalog</a>

## Setup ##
### Setup Permissions

Google recommends the use of service accounts. A service account is a special type of Google Account that represents a non-human user. It is used to authenticate and authorize applications and services to access Google Cloud Platform resources securely. For more information on service accounts, refer to the <a href="https://cloud.google.com/iam/docs/service-account-overview">official documentation.</a>

### Creating and Configuring Service Account
To create a service account and assign the required roles, execute the following commands using the gcloud command-line tool.
Make sure to replace `service-account-name` with your desired service account name, and `project-id` with your Google Cloud Platform project ID on the export clauses.

```
export SERVICE_ACCOUNT_NAME=service-account-name
export PROJECT_ID=project-id
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME --display-name "Dlp to Data Catalog Service Account"
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com --role=roles/dlp.user
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com --role=roles/datacatalog.entryGroupCreator
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com --role=roles/datacatalog.entryCreator
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com --role=roles/datacatalog.tagTemplateCreator
```

For inspecting BigQuery, also run:
```
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com --role=roles/bigquery.dataViewer
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com --role=roles/bigquery.dataEditor
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com --role=roles/bigquery.jobUser
```

For inspecting CloudSQL, also run:
```
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com --role=roles/cloudsql.instanceUser
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com --role=roles/cloudsql.client
```

For running the program on DataFlow, also run:
```
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com --role=roles/dataflow.worker
gcloud projects add-iam-policy-binding $PROJECT_ID --member=serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com --role=roles/storage.objectAdmin
```

### Running locally with your own credentials

Authenticate your Google Account and setup Application Default Credentials.

```
gcloud auth login
gcloud auth application-default login
```

Once authenticated, you will need to make sure you have the necessary permissions to access Google Cloud Platform resources securely using your account.

### Environment Setup and Package Installation
To set up the environment and install the required packages, follow these steps:

1. Create a virtual enviroment.

```
python3 -m venv myenv
```
2. Activate the virtual environment.

```
source myenv/bin/activate
```
3. Install the necessary packages.

```
pip install -r requirements.txt
```
4. Setting Up Python Project and PYTHONPATH.
To ensure proper execution and import handling, we recommend setting up your Python project and configuring the PYTHONPATH environment variable. This allows the Python interpreter to locate and import the required modules and packages correctly.
Consult the official Python documentation on <a href= "https://docs.python.org/3/tutorial/modules.html"> Modules</a> and <a href="https://docs.python.org/3/tutorial/modules.html#packages"> Packages</a> for an in-depth understanding of how Python imports work.

## Run the program locally.
To use the program locally, you need to provide the following parameters:

project: The name of the Google Cloud Platform project.
zone: The name of the zone. Ex. "us-central1"
runner: The execution environment for the program. Use `DirectRunner` for local execution.

These parameters are common to both the BigQuery and CloudSQL execution methods.

Source:
You can choose one of the following options for the source:
- BigQuery
- CloudSQL

You must include one of the following options to define what data to inspect:

1. Using all available info types with `--location_category LOCATION_CATEGORY`
location_category: The location specifying the localization of the inspection results.
Replace `LOCATION_CATEGORY` with an appropriate value.

2. Using a specific DLP template with `--dlp_template RESOURCE_LOCATION/inspectTemplates/TEMPLATE_ID`
template_id: Identifier for a predefined DLP inspection configuration.
resource_location: Location storing DLP template for inspection configuration. Ex: global
Replace `RESOURCE_LOCATION` and `TEMPLATE_ID` with appropriate values.



### BigQuery:
```
python3 -m dlp.run \
--project PROJECT \
--location_category LOCATION_CATEGORY \
--zone ZONE \
--runner RUNNER \
bigquery \
--dataset DATASET \
--table TABLE
```
BigQuery Parameters:

- dataset: The name of the BigQuery dataset to analyze.
- table: The BigQuery table to be scanned. If None, the entire dataset will be scanned. Optional.

### CloudSQL:

CloudSQL Parameters:
The following additional parameters are required for running the project with CloudSQL as the data source:

- instance: The name of the CloudSQL instance.
- service_account: Email address of the service account to be used.
- db_name: The name of the database within the CloudSQL instance.
- db_type: The type of the database (only accepts `mysql` or `postgres`).
- table: The name of the table to inspect within the CloudSQL database. If None, the entire dataset will be scanned. Optional.

#### For CLoudSQL (MySQL):

```
python3 -m dlp.run \
--project PROJECT \
--location_category LOCATION_CATEGORY \
--zone ZONE \
--runner RUNNER \
cloudsql \
--instance INSTANCE \
--service_account SERVICE_ACCOUNT \
--db_name DB_NAME \
--db_type mysql \
--table TABLE
```

#### For CloudSQL (Postgres):

```
python3 -m dlp.run \
--project PROJECT \
--location_category LOCATION_CATEGORY \
--zone ZONE \
--runner RUNNER \
cloudsql \
--instance INSTANCE \ 
--service_account SERVICE_ACCOUNT \
--db_name DB_NAME \
--db_type postgres \
--table TABLE
```

Make sure to replace the placeholder values (PROJECT, LOCATION_CATEGORY, ZONE, DATASET, INSTANCE, DB_NAME, and TABLE) with the appropriate values for your specific setup.

## Run the program on DataFlow.

This program can be run on DataFlow, a fully managed service that optimizes for processing time and runs the program in the cloud. This makes it ideal for processing really large tables, as the parallel jobs can significantly speed up the processing time.

To use the program on DataFlow, you will need to create a template and the DataFlow job.

### Installation:

1. Clone the program from github into the cloud shell.

### Usage:

1. Move to the program directory. 

2. Create a [virtual enviroment](#Environment-Setup-and-Package-Installation) and install packages.

3. Create the template by running the program with the appropriate parameters. In this case, use the run_dataflow file and use the parameters as [running the program locally](#run-the-program-locally). The new parameters include `temp_location`, `staging_location`, `template_location`, and `output_txt_location`. Here's an example command:

Replace TEMP_LOCATION, STAGING_LOCATION, TEMPLATE_LOCATION, and OUTPUT_TXT_LOCATION with the actual values appropriate for your setup.

- TEMP_FILE_LOCATION: The temporary location where DataFlow will store intermediate data during the job execution. It should be a Google Cloud Storage (GCS) path, such as "gs://your-bucket/temporary_location".

- STAGING_LOCATION: The staging location for DataFlow job resources. It should be a GCS path, such as "gs://your-bucket/staging_location".

- TEMPLATE_LOCATION: The GCS path where the DataFlow template file will be stored. It should be a GCS path, such as "gs://your-bucket/template_location".

- OUTPUT_TXT_LOCATION: The desired location where the output of the DataFlow job will be saved. It should be a GCS path, such as "gs://your-bucket/output_location"

```
python dataflow.run.py \
--temp_file_location TEMP_FILE_LOCATION \
--staging_location STAGING_LOCATION \
--template_location TEMPLATE_LOCATION \
--output_txt_location OUTPUT_TXT_LOCATION \
--runner DataflowRunner \
--REST OF PARAMETERS
```
Make sure to include --runner DataflowRunner to specify the execution mode. The runner parameter determines the execution environment for the program.


1. Create the DataFlow Job from your template saved in Google Cloud Storage.

```
gcloud dataflow jobs run NAME --gcs-location=TEMPLATE_LOCATION --service-account-email=SERVICE_ACCOUNT
```

Replace JOB_NAME with a name for your DataFlow job, and TEMPLATE_LOCATION with the correct format of the template file's Google Cloud Storage path, for example, "gs://your-gcs-path-to-template".