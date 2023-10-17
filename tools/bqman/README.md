# What is BQMan?

BQMan has been designed to seamlessly interface with Google BigQuery to automate the provisioning and ongoing management of datasets and tables. BQMan provides the following modes of operation:

* **Pull**: downloads the Bigquery table schema as JSON files for a given dataset.
* **Push**: creates the Bigquery dataset and tables using a previously downloaded collection of Bigquery table JSON schema files.
* **Update**: allows the addition of nullable columns to Bigquery tables.
* **Patch**: allows the modification of BigQuery table descriptions.
* **Backup**: generates a backup of a given Bigquery dataset. The backup is stored in a Google Cloud storage Bucket as sharded CSV files.
* **Restore**: creates a Bigquery Dataset and tables using a previously downloaded collection of sharded CSV files in a Google Cloud Storage Bucket that was generated from a previous backup.
* **Delete**: deletes a dataset provided it does not contain any tables.
* **Import Spreadsheet**: generates BigQuery schema files from a Google Spreadsheet.
* **Import SQL Server**: generates BigQuery schema files from a Microsoft SQL Server database.
* **Destroy**: deletes a dataset even if it contains tables. This feature is available in the bqadmin executable and should be used sparingly using a short-lived service account.

## Application Usage


```
./dist/bqman --help
2020/12/30 14:22:19 InitExecutionModes() executing
2020/12/30 14:22:19 InitExecutionModes() completed
usage: bqman --project=PROJECT [<flags>] <command> [<args> ...]

A command-line BigQuery schema forward/reverse engineering tool.

Flags:
  --help                   Show context-sensitive help (also try --help-long and --help-man).
  --cache_dir=".bqman"     Cache file location
  --quiet                  Do not write messages to consoles
  --project=PROJECT        GCP Project ID
  --dataset=DATASET        BigQuery Dataset
  --location="australia-southeast1"  
                           BigQuery dataset location
  --schema_dir=SCHEMA_DIR  BigQuery schema directory

Commands:
  help [<command>...]
    Show help.

  pull
    Extract BigQuery table JSON schema files; Needs --project=PROJECT_ID --dataset=DATASET

  push [<flags>]
    Create BigQuery tables with JSON schema files; Needs --project=PROJECT_ID --dataset=DATASET --schema_dir=SCHEMA_DIR <--config=CONFIG.json>

  update
    Update BigQuery schema with JSON schema files; Needs --project=PROJECT_ID --dataset=DATASET --schema_dir=SCHEMA_DIR

  patch
    Patch BigQuery schema with JSON schema files; Needs --project=PROJECT_ID --dataset=DATASET --schema_dir=SCHEMA_DIR

  backup --gcs_bucket=GCS_BUCKET
    Backup BigQuery dataset to GCS as CSV; Needs --project=PROJECT_ID --dataset=DATASET --gcs_bucket=GCS_BUCKET

  restore --gcs_path=GCS_PATH
    Restore BigQuery dataset from GCS; Needs --project=PROJECT_ID --dataset=DATASET --gcs_path=GCS_PATH --schema_dir=SCHEMA_DIR

  delete
    Delete EMPTY BigQuery dataset or table; Needs --project=PROJECT_ID --dataset=DATASET [--table=TABLE]

  import_spreadsheet [<flags>]
    Generate Bigquery schema from a Google spreadsheet; Needs --project=PROJECT_ID --dataset=DATASET [--spreadsheet=SPREADSHEET_ID] [--sheet=SHEET_NAME]
    [--range=SHEET_RANGE]

  import_sqlserver --server=SERVER --user=USER --password=PASSWORD --database=DATABASE [<flags>]
    Generate Bigquery schema from a live Microsoft SQL Server database; Needs --project=PROJECT_ID --dataset=DATASET --server=SERVER --port=PORT --user=USER
    --password=PASSWORD --database=DATABASE
```



## Pull


```
  pull
    Extract BigQuery table JSON schema files; Needs --project=PROJECT_ID --dataset=DATASET
```


The Pull command can be used to extract the BiqQuery schema files for all tables within a given dataset. This is achieved by invoking BQMan pull and specifying the project and dataset parameters. BQMan allows you to specify an optional cache directory as a parameter and this is set to “.bqman” in the current working directory, if it is not specified. The cache directory will be created if it doesn’t already exist. BQMan produces log messages to standard out. The BQMan pull command iterates through all tables within the given dataset and generates corresponding BigQuery JSON schema files within the cache directory. 

Once the command completes execution, we can browse the cache directory to see the files that were generated. The top level of the cache directory specifies the GCP Project ID, followed by the BigQuery dataset name, the command invoked (which in this case is pull), followed by the current and history subfolders. The history subfolder includes a chronological listing of all previous program invocations with a unique directory for each time that BQMan was executed. BQMan creates a new directory within the history folder using the human readable Unix system time for the directory name. This directory contains all the BigQuery JSON schema files for the specified dataset. As shown here, the schema files are named using the GCP Project ID, Dataset name, table name followed by the “.schema” suffix. BQMan replaces the schema file in the current subfolder, if the schema has changed between program invocations. This allows DevOps teams to implement a Gitops style deployment strategy for BigQuery schema management. 

BQMan also supports the generation of BigQuery JSON schema files for tables that contain nested fields. When we invoke BQMan pull and specify a dataset that contains nested address fields. We can see that the generated BigQuery JSON schema files show the nested fields within the JSON.


## Push


```
push [<flags>]
    Create BigQuery tables with JSON schema files; Needs --project=PROJECT_ID --dataset=DATASET --schema_dir=SCHEMA_DIR <--config=CONFIG.json>
```


BQMan Push allows the creation of BigQuery datasets and tables using the BigQuery JSON schema files that were previously generated using BQMan Pull. In this instance, we are using BQMan Push to create the Nested dataset and table using the BigQuery JSON file that was generated earlier using BQMan Pull. We can verify that the table was created successfully using the “gcloud alpha bq” command to describe the table.


## Update


```
update
    Update BigQuery schema with JSON schema files; Needs --project=PROJECT_ID --dataset=DATASET --schema_dir=SCHEMA_DIR
```


BQMan Update allows the addition of new nullable columns to BigQuery tables by modifying the Bigquery JSON files. We can verify the successful execution of BQMan Update by using the “gcloud alpha bq” command to describe the modified table.


## Patch 


```
patch
    Patch BigQuery schema with JSON schema files; Needs --project=PROJECT_ID --dataset=DATASET --schema_dir=SCHEMA_DIR
```


The “patch” command allows the modification of column descriptions of existing tables.


## Backup


```
backup --gcs_bucket=GCS_BUCKET
    Backup BigQuery dataset to GCS as CSV; Needs --project=PROJECT_ID --dataset=DATASET --gcs_bucket=GCS_BUCKET
```


BQMan Backup allows the backup of an entire BigQuery dataset to Google Cloud storage as timestamped, sharded CSV export files. BQMan Backup iterates through all the tables in the given dataset and generates the sharded CSV export files in a newly created time stamped folder within the provided GCS bucket. We can verify the successful creation of the CSV export files by listing the files in GCS using the GSUTIL command as well as via Google Cloud Console.


## Restore


```
restore --gcs_path=GCS_PATH
    Restore BigQuery dataset from GCS; Needs --project=PROJECT_ID --dataset=DATASET --gcs_path=GCS_PATH --schema_dir=SCHEMA_DIR
```


BQMan Restore allows the restoration of a previously backed up BigQuery dataset from Google Cloud Storage. This command requires the GCS Project ID, the fully qualified GCS path containing the sharded BigQuery CSV export files, the JSON schema directory to use for table creation and the BigQuery dataset to create. In this example, we are creating the sec_au_copy dataset using the previously generated CSV export files for the sec_au dataset from GCS.


## Import Spreadsheet


```
import_spreadsheet [<flags>]
    Generate Bigquery schema from a Google spreadsheet; Needs --project=PROJECT_ID --dataset=DATASET [--spreadsheet=SPREADSHEET_ID] [--sheet=SHEET_NAME]
    [--range=SHEET_RANGE]
```



## Import SQL Server


```
import_sqlserver --server=SERVER --user=USER --password=PASSWORD --database=DATABASE [<flags>]
    Generate Bigquery schema from a live Microsoft SQL Server database; Needs --project=PROJECT_ID --dataset=DATASET --server=SERVER --port=PORT --user=USER
    --password=PASSWORD --database=DATABASE
```

## bqman.go Functions


```
func ProcessBackup(trotter *controller.Trotter)
    ProcessBackup creates sharded CSV files for each table within a dataset in GCS

func ProcessDelete(trotter *controller.Trotter)
    ProcessDelete is used to delete a non-empty dataset from BigQuery

func ProcessImportSpreadsheet(trotter *controller.Trotter)
    ProcessImportSpreadsheet is used to generate BigQuery JSON schema files fromGoogle Sheets

func ProcessImportSqlserver(trotter *controller.Trotter)
    ProcessImportSqlserver is used to generate BigQuery JSON schema files from a SQL server database

func ProcessPatch(trotter *controller.Trotter)
    ProcessPatch is used to modify column descriptions

func ProcessPull(trotter *controller.Trotter)
    ProcessPull generates BigQuery JSON schema files for a given dataset

func ProcessPush(trotter *controller.Trotter)
    ProcessPush creates a new dataset and tables using BigQuery JSON schema files

func ProcessRestore(trotter *controller.Trotter)
    ProcessRestore is used to restore BigQuery tables from a GCS backup

func ProcessUpdate(trotter *controller.Trotter)
    ProcessUpdate is used to add new NULLABLE columns at the end of a table
```

