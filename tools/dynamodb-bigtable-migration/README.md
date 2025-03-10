# DynamoDB to Bigtable Migration Utility

## Overview

The Bigtable Migration utility efficiently migrates data from a DynamoDB table to a Bigtable table. The utility reads data from a Cloud Storage bucket where the DynamoDB export files are stored. Next, the job transforms the data to ensure compatibility with Bigtable's structure and format, converting [DynamoDB attributes](docs/sample_dynamodb_row.json) to [Bigtable rows](docs/sample_bigtable_row.json). Finally, the job writes the transformed data into a designated Bigtable table.

## Prerequisites

*   **AWS Account:** An active AWS account with the DynamoDB table you want to migrate.
*   **Google Cloud Project:** An active Google Cloud project with a Bigtable instance and table created.
*   **AWS Credentials:** Properly configured AWS credentials with access to your DynamoDB table and S3 bucket.
*   **Google Cloud Credentials:** Properly configured Google Cloud credentials with access to your GCS bucket, Dataflow  and Bigtable instance.
*   **Artifact Registry:** An [Artifact Registry](https://cloud.google.com/artifact-registry/docs/repositories/create-repos#create) repository to store the Docker container image for the template.

*   **`gsutil`:** The `gsutil` command-line tool installed and configured with your Google Cloud credentials.

### DynamoDB

*   **DynamoDB table partition key:** The table must have unique Partition Keys. The utility reads the DynamoDB `Partition Key` and uses it as a `Bigtable Row Key`. Currently, the utility does not consider the DynamoDB Sort Key in mapping row keys.
*   **DynamoDB export:** The utility supports importing DynamoDB Full Exports. It does not support importing Incremental Exports.

### Bigtable

*   **Bigtable Table:** If you don't specify a Bigtable `table` in the environment file, the utility will create one for you.To migrate data to a specific Bigtable table, you need to create the table and at least one column family beforehand. The utility will create `column qualifier` in the specified column family.
*   **Bigtable row key:** The DynamoDB `partition key` will be mapped as the `row key` in Bigtable. Along with the `table name` and `column family`, specify the DynamoDB table `partition key` as a parameter in the .env file.

## Migration Steps

**1. Export Data from DynamoDB table to S3**

*   Navigate to your DynamoDB table in the AWS Management Console.
*   Follow the instructions in the [AWS documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/S3DataExport_Requesting.html) to take a Full Export of your DynamoDB table to an S3 bucket.
*   **Key Configuration Options:**
	*   **S3 Bucket:** Specify the name of your S3 bucket.
	*   **IAM Role:** Ensure the IAM role has write access to the S3 bucket.


	When exporting a DynamoDB table to S3, the data is organized within your S3 bucket using a specific structure. Here's a general representation of that structure:

	```
	my-exports/
	└── AWSDynamoDB/
		└── 1234567890abcdef0123456789abcdef0/
			├── data/
			│   └── 1234567890abcdef0123456789abcdef0-000001.json.gz
			│   └── 1234567890abcdef0123456789abcdef0-000002.json.gz
			│   └── ...
			├── manifest.json
			└── schema.json
	```

	The DynamoDB export data is stored in the `data/` directory.

**2. Transfer Data from S3 to Google Cloud Storage (GCS)**

*   Use the following `gsutil` command to copy the data from your S3 bucket to your GCS bucket:
	```
	gsutil cp -r s3://<your-s3-bucket-name>/AWSDynamoDB/<export-id>/data/ gs://<your-gcs-bucket-name>/<destination-folder>/
	```


**3. Build and deploy the Dataflow flex template to import the data**

*    Before you begin, make sure you have the following installed:

	 ```
     Java Development Kit (JDK) 11
     Apache Maven 3
     ```

*   Clone the repository:

	```
	git clone https://github.com/GoogleCloudPlatform/professional-services.git
    cd ./professional-services/tools/dynamodb-bigtable-migration

	```



*   Create a `.env` file setting the following parameters:
	```
	vi ./scripts/.env
	```

	```bash
	PROJECT_ID=<<GCP Project ID>> #e.g: test-project
	REGION=<<GCP Region>> #e.g: us-central1

	REPOSITORY=<<Artifactory repository>> #e.g: "cbt-flextemplates"
	IMAGE_NAME=<<Name of the docker image along with tag>> #e.g: bigtable-data-import:latest

	FLEX_TEMPLATE_SPEC_FILE_PATH=<<GCS Path to store the flex template file specification>> # "gs://<bucket-name>/templates/templatename"
	STAGING_LOCATION=<<GCS Path to store the staging data >>   # "gs://<bucket-name>/templates/templatename"
	TEMP_LOCATION=<<GCS Path to store the flex template file specification>> # "gs://<bucket-name>/templates/templatename"

	INPUT_FILEPATH=<<GCS path containing the DynamoDB exports>> # gs://sample-bucket-test/dynamodb-export/*.json.gz
	BIGTABLE_INSTANCE_ID=<<Name of the Bigtable instance>>  #bigtable-clusterOptional parameters
	BIGTABLE_ROW_KEY=<<Provide DynamoDB Partition Key that will be used as Bigtable row key >> #Username

	// Optional parameters
	BIGTABLE_TABLE_ID=<<Name of the Bigtable table>> #bigtable-table
	BIGTABLE_COL_FAMILY=<<Provide Bigtable Column Family>> #cf1
	```

*   Google Cloud authentication:

	```bash
	gcloud auth application-default login
	export GOOGLE_APPLICATION_CREDENTIALS="/Users/${USER}/.config/gcloud/application_default_credentials.json"
	```

*   Execute the below script from the project root directory to build the flex template:

	```bash
	sh ./scripts/flextemplate-build.sh
	```

	Successful execution of the script will generate the following artifacts:

	*   Docker image in the Artifactory registry
	*   Flex template specification file in the Cloud Storage location

**4. Executing the Flex Template**

*   Ensure the `.env` file setting the appropriate pipeline options for migration.

	```json
	[
	{
		"name": "inputFilePath",
		"label": "GCS Input filepath",
		"helpText": "Represents input filepath (gs://<bucketname>/files/*.json.gz) for loading data. Use wildcards to include all files",
		"regexes": [
		"^gs:\\/\\/[^\\n\\r]+$"
		],
		"isOptional": false
	},
	{
		"name": "bigtableProjectId",
		"label": "Bigtable Project ID",
		"helpText": "bigtableProjectId",
		"isOptional": false
	},
	{
		"name": "bigtableInstanceId",
		"label": "Bigtable Instance ID",
		"helpText": "bigtableInstanceId",
		"isOptional": false
	},
	{
		"name": "bigtableRowKey",
		"label": "Bigtable Row Key",
		"helpText": "Provide the partition key of DynamoDB table that will be used as Bigtable row key",
		"isOptional": false
	},
	{
		"name": "bigtableTableId",
		"label": "Bigtable Table ID",
		"helpText": "bigtableTableId",
		"isOptional": true
	},

	{
		"name": "bigtableColumnFamily",
		"label": "Bigtable Column Family",
		"helpText": "bigtableColumnFamily",
		"isOptional": true
	},
	{
		"name": "bigtableSplitLargeRows",
		"label": "Bigtable Split Large Rows",
		"helpText": "Define if we want to split large rows when writing to Bigtable",
		"isOptional": true
	},
	{
		"name": "bigtableMaxMutationsPerRow",
		"label": "Bigtable Max Mutations Per Row",
		"helpText": "Define the maximum number of mutations per Bigtable row",
		"isOptional": true
	}
	]
	```

*   Execute the below script from the project root directory to run the flex template:

	```
	sh ./scripts/flextemplate-run.sh DYNAMO-BT
	```

*   Once the pipeline is launched, monitor its progress in the Dataflow section of the [Google Cloud Console](https://console.cloud.google.com/dataflow/?hl=en).

*   Check for any errors or warnings during the execution in the [Dataflow Worker logs](https://console.google.com/dataflow/jobs/).
