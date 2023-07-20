# Usage guidelines


## OVERVIEW:

The objective of the tool is to automate the upgrade of DAG files from Composer-v1 (Airflow 1.x) to Composer-v2 
(Airflow 2.x). This process involves handling changes in import statements, operators, and their arguments. By automating 
the migration, the tool saves time, ensures consistency, reduces errors, and minimizes administrative overhead 
associated with manual upgrades.


## DEPLOYMENT:

This tool takes the input DAG based on the location provided in the --_input_dag_folder_ parameter. It reads 
through the input DAG and look for the import statements, operators and arguments to be changed based on the _rules.csv_ file 
which is either the default rules.csv under the ./migration_rules folder or can be custom created in a similar pattern as 
the default rules.csv file. This can be provided to the tool using --_rules_file_ parameter. The changes are made and the 
output DAG file is saved under the location provided in --_output_DAG_ parameter as _filename_v2.py_. A default or custom 
comment is added above all the changes made in the DAG files indicating the type of change done. The tool takes 6 
parameters - 2 required and 4 optional as listed below,

This tool processes the input Directed Acyclic Graph's (DAG) based on the location provided in the --input_dag_folder 
parameter. It scans the input DAG's' for import statements, operators, and arguments that require changes according to the 
rules.csv file. The rules.csv file can either be the default rules.csv under the ./migration_rules folder or a custom
file created in a similar pattern. To use a custom rules file, provide it to the tool using the --rules_file parameter.

Upon applying the changes, the output DAG file is saved under the location specified in the --output_DAG parameter as 
filename_v2.py. A comment is added above each change made in the DAG files, indicating the type of modification. The 
tool accepts six parameters, with two being required and four being optional. The parameters are as follows:

| Parameter Name    | Description                                                                                                                                      | Required/Optional                                                                        |
|-------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| input_dag_folder  | Input folder where Airflow 1.x DAG code is present                                                                                               | Required - supports local and gcs location                                               |
| output_dag_folder | Output folder location where the migrated code will be saved                                                                                     | Required - supports local and gcs location                                               |
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

