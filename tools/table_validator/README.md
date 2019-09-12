# Teradata to BigQuery Table Validator

_Teradata to BigQuery Table Validator_ is a tool that compares tables from a teradata exported table and the translated BigQuery table 

## Usage

There are several ways to use this script. With the schema file, with the dataset names and with just table names.

If you would like to use the **schema file** you can follow the steps below:

1. Set up your config file to follow the same format as the `config_with_schema_output.json`
2. Run the following query to retrieve the schema file in csv format: <br>
`SELECT c.ColumnName, c.TableName, c.ColumnType, c.DefaultValue, c.DatabaseName, c.Nullable, c.ColumnLength FROM dbc.columnsv c JOIN  (SELECT DatabaseName as dbName, TableName as tblName FROM dbc.tablesv WHERE TableKind IN (''T'', ''O'')) AS t  ON c.DatabaseName = t.dbName AND c.TableName = t.tblName ORDER BY c.ColumnId`
           
3. Once you have your schema file set up you can run the following command to run the validator with your schema file:
`python validation.py -s schema_filename -c config_filename.json`

If you would like to run the queries with a separate project please specify with the following example code:
`python validation.py -p project_id -c config_filename.json`

For all other use you can use you must have a config file in order to run the script.
`python validation.py -c config_filename.json`


## Additional Resources
- For your reference on how teradata defines their primary keys and indexes [https://docs.teradata.com/reader/hNI_rA5LqqKLxP~Y8vJPQg/zpAUdxbCo3bnV8NX_S~C4A][link]


[link]: https://docs.teradata.com/reader/hNI_rA5LqqKLxP~Y8vJPQg/zpAUdxbCo3bnV8NX_S~C4A