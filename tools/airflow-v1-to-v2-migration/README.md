# Usage guidelines


## OVERVIEW:

The objective of the tool is to automate the upgrade of DAG files from Composer-v1 (Airflow 1.x) to Composer-v2 
(Airflow 2.x). This process involves handling changes in import statements, operators, and their arguments. By automating 
the migration, the tool saves time, ensures consistency, reduces errors, and minimizes administrative overhead 
associated with manual upgrades.


## DEPLOYMENT:

This tool processes the input Directed Acyclic Graph's (DAG) based on the location provided in the --input_dag_folder 
parameter. It scans the input DAG's for import statements, operators, and arguments that require changes according to the 
rules.csv file. The rules.csv file can either be the default rules.csv under the ./migration_rules folder or a custom
file created in a similar pattern. To use a custom rules file, provide it to the tool using the --rules_file parameter.

Upon applying the changes, the output DAG files are saved under the location specified in the --output_DAG parameter as 
filename_v2.py. A comment is added above each change made in the DAG files, indicating the type of modification. The 
tool accepts six parameters, with two being required and four being optional. The parameters are as follows:

| Parameter Name    | Description                                                                                                                                      | Required/Optional                                                                        |
|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| input_dag_folder  | Input folder where Airflow 1.x DAG code is present                                                                                               | Required                                                                                 |
| output_dag_folder | Output folder location where the migrated code will be saved                                                                                     | Required                                                                                 |
| rules_file        | Location to custom rules.csv file. The custom rules file can be created in the same pattern as the rules.csv file under ./migration_rules folder | Optional - this will default to rules.csv packaged with the utility in case not provided |
| add_comments      | If Flag is True, custom comments can be added via the next parameter                                                                             | Optional - True by default                                                               |
| comments          | Client can customize to custom comment                                                                                                           | Optional- by default will be a generic comment                                           |
| report_req        | True/False - create migration report in output DAG folder                                                                                        | Optional - by default will be True                                                       |


## ADDING ARGUMENT CHANGES:

In the rules.csv file, each operator entry consists of three rows representing import, operator, and argument changes, 
respectively. To implement argument changes for a specific operator, include the corresponding argument changes in the 
rules.csv file under the respective operator column. Place the argument changes in the following format after the 
"Changes in operator" row.

``` 
Operatorname,Argument Changes,Operatorname(,"all arguments to be changed separate by , ",Argument Changes,TRUE,FALSE 
```

For example, if BigQueryOperator has region parameter and jar parameter that needs to be added as mandatory in airflow-v2. 
They can be added using the below line after "BigQueryOperator,Changes in Operator,BigQueryOperator,BigQueryExecuteQueryOperator,Operator Name Change,TRUE,FALSE,"

```
BigQueryOperator,Argument Changes,BigQueryOperator(,"region='us-central1',jar=abc.jar" ,Argument Changes,TRUE,FALSE,
```

## Commands:

#### With mandatory parameters: 

``` 
python3 run_mig.py --input_dag_folder="Input-DAG-location" --output_dag_folder="Output-DAG-location" 
```

#### With all parameters: 

```` 
python3 run_mig.py --input_dag_folder="Input-DAG-location" --output_dag_folder="Output-DAG-location" --rules_file="Rules_folder location" --add_comments=TRUE --comments="Custom comments to be added for the changes" --report_req="for final generation of report"
````

#### Sample Command

```
python3 run_mig.py  --input_dag_folder=/airflow/airflow-v1-to-v2-migration/migration_rules/input.dag --output_dag_folder=/airflow/airflow-v1-to-v2-migration/migration_rules/output.dag  --rules_file=/airflow/airflow-v1-to-v2-migration/migration_rules/rules.csv --add_comments=TRUE  --comments=”Operator Name changed” --report_req=”for final generation of report”
```

## Output and Report Generation: 

The tool generates output files in the specified --output_dag_folder with a "_v2" suffix. Additionally, it creates 
two reports: Summary-Report and Detailed-Report, both located in the same folder. The Summary-Report provides an 
dethe Detailed-Report offers comprehensive information, including rows indicating files with specific import, operator, 
or argument changes, along with corresponding DAG files and their respective alterations. Both reports are generated 
as .txt files. Sample reports are provided below:

#### Sample Summary Report
```
+---------------------------------------------------------------------------------------------------------+
|                                              SUMMARY REPORT                                             |
+--------------------------------------------------------------------+------------------------------------+
| DESCRIPTION                                                        | INFO                               |
+--------------------------------------------------------------------+------------------------------------+
| Total number of DAG's                                              | 6                                  |
| Total number of DAG's with changes:                                | 5                                  |
| Total number of DAG's with import changes:                         | 2                                  |
| Total number of DAG's with import and operator changes:            | 1                                  |
| Total number of DAG's with import, operator and argument changes:  | 2                                  |
| Impacted DAG's with import changes                                 | ['check_imp.py', 'python_imp.py']  |
| ____________________                                               | ____________________               |
| Impacted DAG's with import and operator changes                    | ['dataproc_op.py']                 |
| ____________________                                               | ____________________               |
| Impacted DAG's with import, operator and argument changes          | ['test_arg.py', 'bigquery_arg.py'] |
+--------------------------------------------------------------------+------------------------------------+

```

#### Sample Detailed Report
```
+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                  DETAILED REPORT                                                                                                                                  |
+-----------------+-----------+-----------------+---------+------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------+
| DAG FILE        | AUTOMATED | CHANGE_TYPE     | LINE_NO | OLD_STATEMENT                                                                                                          | NEW_STATEMENT                                                                                  |
+-----------------+-----------+-----------------+---------+------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------+
| check_imp.py    | Y         | Import_Change   | 38      | from airflow.operators.bash_operator import BashOperator                                                               | from airflow.operators.bash import BashOperator                                                |
| test_arg.py     | Y         | Import_Change   | 2       | from airflow.contrib.operators.bigquery_operator import BigQueryCreateEmptyTableOperator                               | from airflow.providers.google.cloud.operators.bigquery import BigQueryCreateEmptyTableOperator |
| test_arg.py     | Y         | Import_Change   | 4       | from airflow.contrib.operators.bigquery_operator import BigQueryOperator                                               | from airflow.providers.google.cloud.operators.bigquery import BigQueryExecuteQueryOperator     |
| test_arg.py     | Y         | Operator_Change | 24      |     t4 = BigQueryOperator(                                                                                             |     t4 = BigQueryExecuteQueryOperator(                                                         |
| test_arg.py     | Y         | Argument_Change | 24      |     t4 = BigQueryExecuteQueryOperator(                                                                                 |     t4 = BigQueryExecuteQueryOperator(                                                         |
|                 |           |                 |         |                                                                                                                        |         region='us-central1',                                                                  |
| dataproc_op.py  | Y         | Import_Change   | 27      | from airflow.contrib.operators.dataproc_operator import (DataprocClusterCreateOperator, DataprocClusterDeleteOperator) | from airflow.providers.google.cloud.operators.dataproc import DataprocCreateClusterOperator    |
| dataproc_op.py  | Y         | Import_Change   | 27      | from airflow.contrib.operators.dataproc_operator import (DataprocClusterCreateOperator, DataprocClusterDeleteOperator) | from airflow.providers.google.cloud.operators.dataproc import DataprocDeleteClusterOperator    |
| dataproc_op.py  | Y         | Import_Change   | 28      | from airflow.contrib.operators.dataproc_operator import DataprocClusterCreateOperator                                  | from airflow.providers.google.cloud.operators.dataproc import DataprocCreateClusterOperator    |
| dataproc_op.py  | Y         | Operator_Change | 40      |     create_cluster = DataprocClusterCreateOperator(                                                                    |     create_cluster = DataprocCreateClusterOperator(                                            |
| dataproc_op.py  | Y         | Operator_Change | 48      |     delete_cluster = DataprocClusterDeleteOperator(                                                                    |     delete_cluster = DataprocDeleteClusterOperator(                                            |
| bigquery_arg.py | Y         | Import_Change   | 6       | from airflow.contrib.operators.bigquery_operator import BigQueryOperator                                               | from airflow.providers.google.cloud.operators.bigquery import BigQueryExecuteQueryOperator     |
| bigquery_arg.py | Y         | Import_Change   | 7       | from airflow.contrib.operators.bigquery_check_operator import BigQueryCheckOperator                                    | from airflow.providers.google.cloud.operators.bigquery import BigQueryCheckOperator            |
| bigquery_arg.py | Y         | Operator_Change | 79      | t3 = BigQueryOperator(                                                                                                 | t3 = BigQueryExecuteQueryOperator(                                                             |
| bigquery_arg.py | Y         | Argument_Change | 79      | t3 = BigQueryExecuteQueryOperator(                                                                                     | t3 = BigQueryExecuteQueryOperator(                                                             |
|                 |           |                 |         |                                                                                                                        |     region='us-central1',                                                                      |
| bigquery_arg.py | Y         | Operator_Change | 113     | t4 = BigQueryOperator(                                                                                                 | t4 = BigQueryExecuteQueryOperator(                                                             |
| bigquery_arg.py | Y         | Argument_Change | 113     | t4 = BigQueryExecuteQueryOperator(                                                                                     | t4 = BigQueryExecuteQueryOperator(                                                             |
|                 |           |                 |         |                                                                                                                        |     region='us-central1',                                                                      |
| bigquery_arg.py | Y         | Operator_Change | 158     | t5 = BigQueryOperator(                                                                                                 | t5 = BigQueryExecuteQueryOperator(                                                             |
| bigquery_arg.py | Y         | Argument_Change | 158     | t5 = BigQueryExecuteQueryOperator(                                                                                     | t5 = BigQueryExecuteQueryOperator(                                                             |
|                 |           |                 |         |                                                                                                                        |     region='us-central1',                                                                      |
| bigquery_arg.py | Y         | Operator_Change | 193     | t6 = BigQueryOperator(                                                                                                 | t6 = BigQueryExecuteQueryOperator(                                                             |
| bigquery_arg.py | Y         | Argument_Change | 193     | t6 = BigQueryExecuteQueryOperator(                                                                                     | t6 = BigQueryExecuteQueryOperator(                                                             |
|                 |           |                 |         |                                                                                                                        |     region='us-central1',                                                                      |
| python_imp.py   | Y         | Import_Change   | 2       | from airflow.operators.python_operator import ShortCircuitOperator                                                     | from airflow.operators.python import ShortCircuitOperator                                      |
+-----------------+-----------+-----------------+---------+------------------------------------------------------------------------------------------------------------------------+------------------------------------------------------------------------------------------------+

```


## PRE-REQUISITES: 

1. Necessary python and airflow version installation to be done based on table in next section.
2. DAG folders, to be changed, must be available on the local machine.
3. Airflow v1 to v2 migration tool repo to be forked to the local machine.


## TEST-ENV SETUP

| Airflow 1.x Environment | Airflow 2.x Environment                        |
|-------------------------|------------------------------------------------|
| Python 3.7.1            | Python 3.7.1                                   |
| Airflow - 1.10.15       | Airflow - 2.5.3                                |
|                         | apache-airflow-providers-google version 8.12.0 |

