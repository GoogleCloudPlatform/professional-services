# Snowflake BQ DDL Connector

Connector to access the Snowflake Metastore Data. In snowflake, the DDL information is stored in `information_schema.tables` for table, `information_schema.procedures` for procedures and `information_schema.views` for views.
There are 2 columns stored in the metastore table recording the Last DDL Time and user who executed the last modification.
1. `last_alter_time` : This exists for tables, views and procedures.
2. `last_alter_user` : This exists only for tables.


db_name | object_name | object_type | last_alter_time | last_alter_user | is_latest_record | insert_time 
--- | --- | --- | --- |--- |--- |--- 
test | testTable | T | \<time\> | user1 | true | \<time\>