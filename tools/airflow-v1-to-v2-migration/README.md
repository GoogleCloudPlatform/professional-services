# Usage guidelines


## OVERVIEW:

There have been several upgrades from composer v1(airflow-1.0) to
composer v2(airflow 2.0). The objective of the tool is to make code
changes to DAG files from composer-v1(airflow-1.0) to
composer-v2(airflow 2.0) in accordance with the rules file. Making
manual changes to DAG files can be time-consuming and can lead to
errors.


## CONSTRAINTS: 

1. This tool makes changes only to the import statements and operators based on the default rules.csv or the custom
rules.csv.
2. For possible changes to the arguments of the operators
itself, a comment indicating the change to be made would be added above
the operator. These changes however must be done manually. 


## HOW IT WORKS:

The tool takes 6 parameters - 2 required and 4 optional. The tool reads
through the input DAG and looks for changes to be made based on the
rules.csv. The user can also generate the rules.csv or the default is
taken for asserting the DAG changes. Once the changes are made, a
comment is added above all the changes made. Comments can also be
customized with the Comment and Add comments parameters. Once the
changes are made, the updated DAG gets pushed under the Output DAG folder
location.

| Parameter Name    | Description                                                          | Required/Optional                                                                        |
|-------------------|----------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| input_dag_folder  | Input folder where Airflow 1.x DAG code is present                   | Required - supports local and gcs location                                               |
| output_dag_folder | Output folder location where the migrated code will be saved         | Required - supports local and gcs location                                               |
| rules_file        | Location to custom rules.csv file                                    | Optional - this will default to rules.csv packaged with the utility in case not provided |
| add_comments      | If Flag is True, custom comments can be added via the next parameter | Optional - True by default                                                               |
| comments          | Client can customize to custom comment                               | Optional- by default will be a generic comment                                           |
| report_req        | True/False - create migration report in output DAG folder            | Optional - by default will be True                                                       |


## Command:

#### With mandatory parameters: 

``` 
python3 run_mig.py --input_DAG="Input-DAG-location" --output_DAG="Output-DAG-location" 
```

#### With all parameters: 

```` 
python3 run_mig.py --input_DAG="Input-DAG-location" --output_DAG="Output-DAG-location" --rules_folder="Rules_folder location" --add_comments=FALSE --comments="Custom comments to be added for the changes" --report_req="for final generation of report"
````

#### Sample Command

```
python3 run_mig.py  --input_DAG=/airflow/airflow-v1-to-v2-migration/migration_rules/input.dag --output_DAG=/airflow/airflow-v1-to-v2-migration/migration_rules/output.dag  --rules_folder=/airflow/airflow-v1-to-v2-migration/migration_rules/rules.csv --add_comments=TRUE  --comments=”Operator Name changed” --report_req=”for final generation of report”
```


## PRE-REQUISITES: 

1. DAG folders, to be changed, must be available on the local machine.
2. Airflow tool repo to be forked to the local machine to be executed with the command.


## TEST-ENV SETUP

| Airflow 1.x Environment                        | Airflow 2.x Environment                        |
|------------------------------------------------|------------------------------------------------|
| Python 3.7.1                                   | Python 3.7.1                                   |
| Airflow - 1.10.15                              | Airflow - 2.5.3                                |
| apache-airflow-providers-google version 8.12.0 | apache-airflow-providers-google version 8.12.0 |
