# Hive BQ DDL Connector

Connector to access the Hive Metastore Data. The Connector assumes that the metastore is stored in Cloud SQL instance.
There are 2 columns stored in the metastore table recording the Last DDL Time and user who executed the last modification.
1. `transient_lastDdlTime`
2. `last_alter_user`

The plugin extracts these value from `TABLE_PARAMS`, `TBLS` and `DBS` by joining these. After this a dataframe with following columns is created.

db_name | object_name | object_type | last_alter_time | last_alter_user | is_latest_record | insert_time 
--- | --- | --- | --- |--- |--- |--- 
test | testTable | MANAGED_TABLE | \<time\> | user1 | true | \<time\>