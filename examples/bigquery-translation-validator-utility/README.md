# BQ Translation Validator

A utility to compare 2 SQL Files and point basic differences like column names, table names, joins, function names etc.

## Business Requirements
1. Validation of the SQL by comparing both the Legacy Source SQL and Bigquery SQL
2. Ability to quickly identify any translation errors, right at the beginning of the migration.
3. Get a sense of Translation accuracy
4. Provide a sense of confidence for the Query migration.
5. Saving time for the migration projects without going through data validation process.

## Asset Features
1. Column Validation : The utility will compare the columns used in the query and validate whether all the columns along with column count were matching between source and target SQL.
2. Object Validation : The utility will compare the objects (table, views) used in the query and validate whether all the objects along with object count were matching between source and target SQL.
3. Function Validation : Legacy SQL functions will differ from Bigquery SQL. Hence the function validation will compare only the functions specified in the config file and validate whether all the specified functions along with function count were matching between source and target SQL. The functions are specified in `./config/functions.csv`
4. Join Validation : The utility will compare all the join types (left, right, inner, outer, union) and validate whether all the join types along with the count were matching between source and target SQL. The utility will also take care of cross joins which are in form of 2 tables separated by a comma.
5. Is Null Validation : The utility will compare the IS NULLs and IS NOT NULLs in both the input and output files.
6. Line Count Validation : The utility will compare the number of lines present in both source and target file and gives an indication of whether any logics being missed. A small difference in the count is an acceptable behaviour however a huge difference indicates the validation failure.
7. Dry Run Check : There is inbuilt functionality to detect Syntax error for the input queries and check the total bytes processed.
8. Reporting : The utility will provide a consolidated report comparing all the files and performing all the validations (column, object, function and join validations) on those files. The report will help to identify which validation were failed for which files. 
9. Logging : The utility will log each and every validation status in the log file which is created for each and every source files.
The logging will print more details of the validations like the exact column names, object names, function names that were present in the SQL files, making it more easy to read and exactly pinpoint the reason for the validation failure.
10. Generic Utility : The utility is designed to be more generic, hence it can perform validation on any Source Legacy SQL to Bigquery SQL.


## Instructions to Run

### Run with Test Files in Local

Below packages are need to run the script:pandas, sqlparse, XlsxWriter

1. Install the dependencies listed in requirements.txt using pip3.
    `pip3 install -r requirements.txt `
2. Add your test files with input and output as separate folders. You can add them in the `test_files` folder.
3. Add the functions you want to compare in this run in `./config/functions.csv`.
3. Run the utility
    `python3 main.py -input-path=path/to/input/folder -output-path=path/to/output/folder`
4. Check the result in `validation-translation.xlsx` and `log_files` Folder.

### Run with Test Files in GCS

Below packages are need to run the script:pandas, sqlparse, XlsxWriter, google-cloud-storage

1. Install the dependencies listed in requirements.txt using pip3.
    `pip3 install -r requirements.txt `
2. Create a bucket to store the test files and output.
3. Add your test files with input and output as separate folders in your bucket. You can add them in the `test_files` folder in the bucket.
4. Add the functions you want to compare in this run in `./config/functions.csv`.
5. Run the utility
    ```
    python3 main_dag.py
           -input-path=path/to/input/folder/in/bucket -output-path=path/to/output/folder/in/bucket -bucket=bq-translation_validator
           -project-id=project_name -validation-output-path=path/to/output/folder/of/main_dag/in/bucket
    ```
6. Check the result in `validation-output-path` folder in the bucket specified.

### Run with Composer Support

1. For using the utility with composer, use the file `./composer_dag/bq-datavalidator.py`.
2. Upload the code files in the desired folder in the same folder structure.
3. Make sure the DAG is up and running.
4. Modify the environment variables in Airflow config variables.


The order of execution of the script is as follows

1. line_count.py
2. column_validation.py
3. join_validation.py
4. object_validation.py
5. function_validation.py
6. isnull_validation.py
7. dry_run.py
