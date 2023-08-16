# Teradata BQ DDL Connector

Connector to access the Teradata Metastore Data. In teradata, the DDL information is stored in `TablesV` table with information like `TableKind`, `lastaltertime` and `lastalter_user`.
There are 2 columns stored in the metastore table recording the Last DDL Time and user who executed the last modification.
1. `TablesKind` : Checks for Tables (T), Procedures (P) and Views(V)
2. `lastaltertime`
3. `lastalter_user`


db_name | object_name | object_type | last_alter_time | last_alter_user | is_latest_record | insert_time 
--- | --- | --- | --- |--- |--- |--- 
test | testTable | V | \<time\> | user1 | true | \<time\>