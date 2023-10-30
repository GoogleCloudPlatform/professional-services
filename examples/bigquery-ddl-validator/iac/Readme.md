# BQ DDL Infrastructure Setup

The following module sets up the infrastructure required for BQ DDL Validator. This includes Cloud SQL Instance and the audit databases.

To set up the infrastructure on your end, set the following variable values in tfvars file.

The `database_type` can be `h` for hive, `t` for teradata, `s` for snowflake or `o` for oracle.
Store the credentials file in a trusted location and reference in `credentials_path`. Finally, Specify the db_name for the db type you want to create.

```
project                  = "demo-project-name"
region                   = "asia-east1"
zone                     = "asia-east1-a"
database_version         = "MYSQL_8_0" 
database_type            = "h"
credentials_path         = "./keys.json"
hive_audit_db_name       = "hive_audit_db"
teradata_audit_db_name   = "teradata_audit_db"
snowflake_audit_db_name  = "snowflake_metadata_audit_db"
oracle_audit_db_name     = "oracle_audit_db"
```