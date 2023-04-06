#    Copyright 2023 Google LLC

#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
""" Module for Recommending BQ Optimizations """

import sqlparse
import argparse
import google.cloud
from google.cloud import storage
from utils_optimization.utils_optimization import remove_multiple_whitespaces, get_line_numbers_for_select, create_external_table
from optimization.custom_table_expression.custom_table_expression import consolidated_cte
from optimization.filter_data_before_join.filter_data_before_join import all_filter_before_join
from optimization.distinct.distinct import distinct_optimise
from optimization.select_wildcard.select_wildcard import consolidated_select_optimize
from optimization.cross_join.cross_join import all_cross_joins
from optimization.reduce_to_tmp_tables.reduce_to_tmp_tables import reduce_to_temp
from optimization.self_join.self_join import self_join
from optimization.ntile_to_appprox_quant.ntile_to_appprox_quant import use_approx_quant
from optimization.regex_contains.regex_contains import regex_opt

import datetime
import pandas as pd

# Take in Arguments for test and output folder
def run_optimization(bucket_name, input_folder, uid, project, output_folder):
    global cte, fname, records
    # Read Files from GCS
    storage_client = storage.Client(project= project)
    bucket = storage_client.get_bucket(bucket_name)
    blobs = bucket.list_blobs(prefix=input_folder)
    dataset_id = "bq_long_running_optimizer"
    table_id = "bq_res_tbl"

    sql_list = []
    records_for_df = []

    for blob in blobs:
        downloaded_blob = blob.download_as_text()
        sql_list.append([blob.name, downloaded_blob])
    
    df = pd.DataFrame()
    id=uid


    for file_data in sql_list:
        file_name = file_data[0]
        sql_statements = file_data[1]

        fname = file_name.split('.sql')[0]

        # Clean the comments
        sqlFile_input = sqlparse.format(sql_statements, strip_comments=True).strip()

        # Clean the SQL Files for multiple whitespaces
        sqlFile_input=remove_multiple_whitespaces(sqlFile_input)

        # Parse the sql files to get tokens
        statements_input = sqlparse.parse(sqlFile_input)
        
        result = consolidated_cte(statements_input, sql_statements)
        for logic in result:
            new_row = {}
            new_row["Batch_ID"] = id
            new_row["FileName"] = file_name
            new_row["Best_Practice"] = "Replace multiple CTE with temporary table"
            new_row["Recommendation"] = logic
            records_for_df.append(new_row)
        
        select_result_fin = consolidated_select_optimize(statements_input)
        descr = get_line_numbers_for_select(sql_statements, select_result_fin, fname)
        select_result_fin = []
        for desc in descr:
            new_row = {}
            new_row["Batch_ID"] = id
            new_row["FileName"] = file_name
            new_row["Best_Practice"] = "Select Only Needed Columns"
            new_row["Recommendation"] = desc
            records_for_df.append(new_row)
        
        result = all_filter_before_join(statements_input)
        for logic in result:
            new_row = {}
            new_row["Batch_ID"] = id
            new_row["FileName"] = file_name
            new_row["Best_Practice"] = "Filter Data Before Join"
            new_row["Recommendation"] = logic
            records_for_df.append(new_row)

        distinct_occ= distinct_optimise(statements_input, sqlFile_input)
        if len(distinct_occ) > 0:
            for i in distinct_occ:
                new_row = {}
                new_row["Batch_ID"] = id
                new_row["FileName"] = file_name
                new_row["Best_Practice"] = "Use GROUP BY instead of DISTINCT column names"
                new_row["Recommendation"] = f'found a DISTINCT usage at line no. {i[0]}, instead use {i[1]}'
                records_for_df.append(new_row)
        
        temp_sugg= reduce_to_temp(statements_input)
        if len(temp_sugg) > 0:
            for i in temp_sugg:
                new_row = {}
                new_row["Batch_ID"] = id
                new_row["FileName"] = file_name
                new_row["Best_Practice"] = "Use temporary table instead of long queries with union"
                new_row["Recommendation"] = i
                records_for_df.append(new_row)
        
        result = all_cross_joins(statements_input)
        for logic in result:
            new_row = {}
            new_row["Batch_ID"] = id
            new_row["FileName"] = file_name
            new_row["Best_Practice"] = "Avoid Cross Joins"
            new_row["Recommendation"] = logic
            records_for_df.append(new_row)


        result_from_selfjoin = self_join(statements_input)
        if len(result_from_selfjoin)>0:
            for res in result_from_selfjoin:
                new_row = {}
                new_row["Batch_ID"] = id
                new_row["FileName"] = file_name
                new_row["Best_Practice"] = "Avoid Self Joins"
                new_row["Recommendation"] = res
                records_for_df.append(new_row)

        ntile_sugg= use_approx_quant(statements_input)
        if len(ntile_sugg) > 0:
            for i in ntile_sugg:
                new_row = {}
                new_row["Batch_ID"] = id
                new_row["FileName"] = file_name
                new_row["Best_Practice"] = "Use APPROX QUANTILE instead of NTILE"
                new_row["Recommendation"] = i
                records_for_df.append(new_row)

        result_from_regex = regex_opt(statements_input)
        if len(result_from_regex)>0:
            for res in result_from_selfjoin:
                new_row = {}
                new_row["Batch_ID"] = id
                new_row["FileName"] = file_name
                new_row["Best_Practice"] = "Use LIKE() instead of REGEX_CONTAINS()"
                new_row["Recommendation"] = res
                records_for_df.append(new_row)


    df = pd.DataFrame(records_for_df)        
    ct = datetime.datetime.now()
    output_file_name = f'CTE-optimization{ct}.csv'
    blob = bucket.blob(output_folder + output_file_name)
    blob.upload_from_string(df.to_csv(index=False), 'text/csv')
        

    create_external_table(dataset_id, table_id)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()

    # Take project name and output folder.
    parser.add_argument("-input-path", help="input path for input files directory",default="input")
    parser.add_argument("-bucket", help="bucket name for input files direcrtory",default="bq_long_running_optimization")
    parser.add_argument("-project-id", help="project id for this to run",default="poc-env-aks")
    parser.add_argument("-output-path", help="output path for output files directory",default="output/")
    args = parser.parse_args()

    folder_path = args.input_path
    bucket_name = args.bucket
    project_id = args.project_id
    output_path = args.output_path

    uid = 1
    run_optimization(bucket_name, folder_path, uid, project_id, output_path)

# Command to run the script
# python3 main_dag.py -input-path=<input_folder_path> -output-path=<output_folder_path> -bucket=<bucket_name> -project-id=<project_id>
# eg) python3 main_dag.py
#           -input-path=test_files/input-folder -output-path=test_files/output-folder -bucket=bq-optimizer-bucket -project-id=test-id
