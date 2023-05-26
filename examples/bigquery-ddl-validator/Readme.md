# BigQuery DDL Validator

A utility that will read the Legacy DDL and compare it against the previously extracted DDL and produce an output with the name of the objects where the DDL is no longer matching.


## Business Requirements
Most often, migration projects take many months. At each period, groups of objects are migrated. The freshness of the objects definition depends on the time at which the objects are migrated.

In many cases, the object definitions are updated in the legacy source system due to the immediate business need and the updated definition would not be replicated in the same way in BigQuery. This often results in validation failures during the later stage(UAT and Preprod Testing) of the project. 


## Asset Features
1. Hive DDL Validation : The utility is designed to read from the Hive Metastore and extract the Last DDL Time on Tables and Views along with the user who last updated these. If the tables/views are new, the last updated user is saved as N/A.
2. Teradata DDL Validation : Teradata TablesV contains the metadata information for the tables and databases. The utility can fetch the records in this table for tables, views and procedures and append the findings in the audit metadata table.
3. Snowflake Validation : Each database in snowflake contains information schema table which is different of tables, views and procedures. Based on the user input, utility queries these metadata tables and fetches the latest records.
4. Easy Infrastructure Setup : We provide terraform scripts that can be deployed using the local environment or from cloud shell to set up the audit instance, database and tables in CloudSQL and the resource secret manager based on the input from the user in the tfvars file.
5. Detailed Audit Table : The audit tables are separate for each of the database types supported but the underlying structure remains the same. The Audit table contains the database name, object name, object type(table/view/procedure), last alter time, last alter user, is latest record in the audit table and when the utility was last ran ie. insert time. These help users get detailed understanding of the changes in the objects over time.
6. Best Security Practice using Secret Manager : The utility uses Secret Manager to fetch the on-prem metadata environment credentials. These include the db username, db password and the URL of the db instance to connect to. This differs for different use cases. In case of snowflake, db account is taken as input instead of URL. All the user has to do is to provide the resource secret URL during infrastructure setup and while running the program.
7. Centralized Configuration : The utility reads the configuration for the run from GCS using a JSON file. This only includes the database type (hive/snowflake etc), db_name, object type, resource secret URL, audit instance name, audit db user and audit db password.
8. Generic Utility : The utility is designed to be more generic, hence it can incorporate new database types easily without much code change.


## Instructions to Run

Below packages are needed to run the script: google-cloud-secret-manager, pandas, mysql-connector-python, snowflake-connector-python, cloud-sql-python-connector, google-cloud-storage, oracledb

1. Login to gcloud using `gcloud auth application-default login`. Make sure the environment variable `GOOGLE_APPLICATION_CREDENTIALS` points to credential file.
2. Install the dependencies listed in requirements.txt using pip3.
    `pip3 install -r requirements.txt `
3. Download the key from gcloud or console and save in a trusted folder.
4. Add the required inputs for infrastructure setup in the `tfvars` file in `iac` folder. Then run the following commands  :-
    ```
        terraform init
        terraform plan
        terraform apply
    ```
4. Create a resource secret in GCP with credentials to access the hive/snowflake/teradata cluster. Here are the fields and format required for each.

    4.1 :  Hive

    ```
    {
        "db_instance" : "",
        "db_username": "",
        "db_name":"",
        "db_password":""
    }
    ```

    4.2 : Snowflake
    ```
    {
        "db_user" : "",
        "db_password": "",
        "db_account":""
    }
    ```

    4.3 : Teradata
    ```
    {
        "db_instance" : "",
        "db_user": "",
        "db_password":""
    }
    4.3 : Oracle
    ```
    {
        "db_account" : "",
        "db_user": "",
        "db_password":""
    }
    ```

5. Create a central config and upload in GCP Cloud Storage Bucket. The `db_type` can be of type `teradata`, `snowflake` or `hive`. `obj_type` can be `view`, `table` or `procedure`. Note the fields for `audit_instance_name`, `audit_db_user` and `audit_db_password` from the infrastructure setup.
```
{
    "db_type" : "",
    "db_name" : "",
    "obj_type" : "",
    "resource_secret" : "",
    "audit_instance_name" : "",
    "audit_db_user" : "",
    "audit_db_password" : ""
}
```

6. Run the python script with the path of the configuration file.

```
python3 main.py -gcs_config_path="gs://bucket/path/to/config/file"
```
