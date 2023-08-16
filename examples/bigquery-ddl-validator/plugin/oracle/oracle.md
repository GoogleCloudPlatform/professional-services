# Oracle BQ DDL Connector

Connector to access the Oracle Metastore Data. In Oracle, the metadata information is stored in `all_objects` table inside the database.
There is a column stored in the metastore table recording the Last DDL Time.
1. `last_ddl_time`

The plugin extracts these value from `owner` which is the database name, `object_name` which is table/view/procedure and `last_ddl_time` from `all_objects` table. After this a dataframe with following columns is created.

db_name | object_name | object_type | last_alter_time | last_alter_user | is_latest_record | insert_time 
--- | --- | --- | --- |--- |--- |--- 
test | testTable | T | \<time\> | user1 | true | \<time\>