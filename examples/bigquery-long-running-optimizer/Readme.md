# BQ Long Running Optimizer

A utility that reads the entire SQL and provides a list of suggestions that would help to optimize the query and avoid the long running issues.


## Business Requirements
One of the most frequently ocurring issues in BigQuery are Long Running Issues. This is seen in 2 cases :-

1. The  Queries go into long running mode and eventually fail with the timeout error after running for 6+ hours. 
2. The query runs for many hours , consumes more computation and finally produces an output.

In both these cases, most likely the root cause is due to the un-optimized bigquery sql. It will help to identify if the query is likely to fall into long running issues before execution saving time, resources and cost.


## Asset Features
1. It is recommended to avoid joins that generate more outputs than inputs. The utility advises to avoid `CROSS JOIN` and points out the line number of the SQL query where it is present.
2. When using multiple `CTE`, BigQuery processes them each time. It is better to replace them with `temporary tables` which are computed only once. The utility points out the number of times a `CTE` is used, the line number and recommends to replace with `temporary tables`.
3. The utility also recommends using `GROUP BY` instead of `DISTINCT`. It points out the line number of `DISTINCT` and recommends `GROUP BY` with the object name to give more clarity.
4. The utility is able to identify if aggregation happens after joins. This leads to more processing. The utility recommends filtering data before joins by identifying the line number and the filter clause.
5. BigQuery also recommends to use `APPROX_QUANTILE` instead of `NTILE`. The utility identifies the line number of `NTILE` and provides a recommendation.
6. Writing Large Queries can make reading more complex. Reusing these queries also becomes an issue. The utility points out large queries separated by `UNION` to be converted to `temporary tables` by pointing the line numbers to the start of these queries.
7. `REGEXP_CONTAINS` is slower in compute time. The utility identifies the line number where the `REGEXP_CONTAINS` was used and recommends using `LIKE` instead.
8. It is recommended to use only the needed columns in the `SELECT` statement. The utility identifies use of `*` with the line number and statement.
9. Self joins should be avoided in BigQuery. The utility identifies where the self joins are ocurring and table name.


## Instructions to Run

Below packages are need to run the script:pandas, sqlparse

1. Login to gcloud using `gcloud auth application-default login`. Make sure the environment variable `GOOGLE_APPLICATION_CREDENTIALS` points to credential file.
1. Install the dependencies listed in requirements.txt using pip3.
    `pip3 install -r requirements.txt `
2. Add your test files to a folder. You can add them in the `test_files` folder.
3. Run the utility
    `python3 main_dag.py -input-path=path/to/input/folder -bucket=bucket_name -project-id=project_name -output-path=path/to/output/folder`
4. The results are stored in `bucket` specified above in the `output-path` folder.


The order of execution of the script is as follows

1. ./custom_table_expression/custom_table_expression.py
2. ./select_wildcard/select_wildcard.py
3. ./filter_data_before_join/filter_data_before_join.py
4. ./distinct/distinct.py
5. ./reduce_to_tmp_tables/reduce_to_tmp_tables.py
6. ./cross_joins/cross_joins.py
7. ./self_join/self_join.py
8. ./ntile_to_appprox_quant/ntile_to_appprox_quant.py
9. ./regex_contains/regex_contains.py