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
""" Module for validating BQ tranlation with Composer and GCS Support"""

import sqlparse
import logging,pprint,io
import pandas as pd
from google.cloud import storage
from validations.column_validation.column_validation import get_column_lists
from validations.join_validation.join_validation import get_join_lists
from validations.object_validation.object_validation import get_object_names
from validations.functions_validation.functions_validation import get_fun_lists
from validations.isnull_validation.isnull_validation import get_isnull_lists
from validations.dry_run.dry_run import dry
from utils.utils import generate_count_and_name_output_string,remove_multiple_whitespaces,retrieve_view_create_statement,log_list_to_string,formatNewLines
import datetime
import argparse

def run_validation(bucket_name,output_path,input_path,validation_output_path,archive,uid):
    archive=False
    ct_start = datetime.datetime.now()
    # Read Files from GCS
    client = storage.Client()
    bucket = client.get_bucket(bucket_name)
    blobs_output = bucket.list_blobs(prefix=output_path)
    blobs_input =  bucket.list_blobs(prefix=input_path)
    out_list,inp_list = [],[]
    temp_file_name = 'temp.sql'
    if archive == 'False':
        archive=False
    for blob in blobs_output:
            downloaded_blob = blob.download_as_text()
            blob.download_to_filename(temp_file_name)
            fd1 = open(temp_file_name,'r')
            length = len(fd1.readlines())
            out_list.append([blob.name,downloaded_blob,length])
            if archive:
                bucket.rename_blob(blob, new_name=blob.name.replace('test_files_demo/', 'test_files_archived/'))

    for blob in blobs_input:
        downloaded_blob = blob.download_as_text()
        blob.download_to_filename(temp_file_name)
        temp_file = open(temp_file_name,'r')
        length = len(temp_file.readlines())
        inp_list.append([blob.name,downloaded_blob,length])
        if archive:
            bucket.rename_blob(blob, new_name=blob.name.replace('test_files_demo/', 'test_files_archived/'))
    
    
    
    # Declare the excel dataframe which will have aggregate data
    df = pd.DataFrame()

    # Track the total success and failures
    success_files = 0
    failure_files = 0

    # Fetch the function list and store in a Set
    blob_functionlist = bucket.blob('functions.csv')
    data = blob_functionlist.download_as_bytes()
    data = pd.read_csv(io.BytesIO(data)) 
    listf=data['FunctionName'].tolist()
    fun=set([])
    for func in listf:
        fun.add(func.upper())

    id=uid
    total_success_column_validation=0
    total_success_join_validation=0
    total_success_object_validation=0
    total_success_function_validation=0
    total_success_statement_validation=0
    total_files=0

    # Iterate over each common file in the input and output directories
    for i,j in zip(inp_list,out_list):
        total_files+=1
        # Add time based logs and log formats
        main_file_name = i[0].split('/')[-1]
        fName = main_file_name.split('.sql')[0]
        logging.basicConfig(filename="std.log", filemode='w',format='%(asctime)s %(levelname)-8s %(message)s',level=logging.INFO,datefmt='%Y-%m-%d %H:%M:%S',force=True)
        root = logging.getLogger()
        root.info("Initializing SQL Validation\n\n")
        root.info("********* Processing "+ str(fName)+ " **********\n")
        file_name = fName
        
        # Declare the dataframe row. This will be populated with results.
        new_row = {}

        # Final Validation Results
        finalValidationResults = {
            "column count validation" : False,
            "column name validation" : False,
            "join count validation" : False,
            "object count validation" : False,
            "object name validation" : False,
            "function count validation" : False,
            "is null validation": False,
            "dry run check" : "Success"
        }

        # Clean the comments
        sqlFile_input = sqlparse.format(i[1], strip_comments=True).strip()
        sqlFile_output = sqlparse.format(j[1], strip_comments=True).strip()

        # Remove all newlines
        sqlFile_input = formatNewLines(sqlFile_input)
        sqlFile_output = formatNewLines(sqlFile_output)

        # Clean the SQL Files for multiple whitespaces
        root.info("Preprocessing SQL Files for multiple whitespaces\n")
        sqlFile_input=remove_multiple_whitespaces(sqlFile_input)
        sqlFile_output=remove_multiple_whitespaces(sqlFile_output)

        # Parse the sql files to get tokens
        statements_input = sqlparse.parse(sqlFile_input)
        statements_output = sqlparse.parse(sqlFile_output)
        statementCount_input,statementCount_output = len(statements_input),len(statements_output)

        # Error in identifying SQL statements
        if len(statements_input)<=0 or len(statements_output) <=0:
            root.warning("Could not parse the statements for the file : ", fName)
            continue

        # Check if the files have mutliple statements and get the view statement
        all_statements_input=statements_input
        all_statements_output=statements_output

        statements_input=retrieve_view_create_statement(statements_input)
        statements_output=retrieve_view_create_statement(statements_output)
        
        new_row["Batch_ID"] = f"bqtv_{id}"
        # Add the FileName to the dataframe
        new_row["FileName"] = file_name

        # Line count
        root.info("Initializing Line Count Validation")
        lines_inp,lines_out = int(i[2]),int(j[2])
        percentage_diff = int(100* (lines_out-lines_inp) / (lines_inp))
        if percentage_diff>=0:
            percentage_difference = '+'+str(percentage_diff)
        else:
            percentage_difference = str(percentage_diff)
        new_row["Line Count"] = str(str(lines_inp)+'|'+str(lines_out)+'|'+percentage_difference+"%")
        root.info("Input Line Count: "+ str(lines_inp))
        root.info("Output Line Count: "+ str(lines_out))
        root.info("Percentage Difference = "+ str(percentage_difference) + "%\n")
        root.info("Finished Line Count Validation\n")

        # Column Validation
        root.info("Initializing Line Count Validation")
        status_count_list = []
        status_name_list = []
        
        all_column_input = []
        all_column_output = []

        for i in range(len(all_statements_input)):
            col_list_input,col_list_output = get_column_lists(all_statements_input[i], all_statements_output[i])
            status_count, status_name = False, False

            root.info("Input Column Count for statement " + str(i) + ": "+ str(len(col_list_input)))
            root.info("Output Column Count for statement " + str(i) + ": " + str(len(col_list_output)))
            if len(col_list_output)==len(col_list_input):
                status_count = True
            root.info(f"Columns Count Validation for statement "+ str(i) + ": {status_count}")
            if (col_list_input == col_list_output):
                status_name = True
            
            col_list_string_input= log_list_to_string(col_list_input)
            col_list_string_output= log_list_to_string(col_list_output)

            root.info(f"Input Column List:\n{col_list_string_input}")
            root.info(f"Output Column List:\n{col_list_string_output}")
            root.info(f"Columns Name Validation: {status_name}")

            status_count_list.append(status_count)
            status_name_list.append(status_name)
            all_column_input += col_list_input
            all_column_output += col_list_output
        
        status_count = all(status_count_list)
        status_name = all(status_name_list)

        new_row["Column Validation"] = generate_count_and_name_output_string("column", all_column_input, all_column_output, status_count, status_name)

        if status_count:
            status_count = "Success"
        else:
            status_count = "Failure"
        
        if status_name:
            status_name = "Success"
            total_success_column_validation+=1
        else:
            status_name = "Failure"

        finalValidationResults["column count validation"] = status_count
        finalValidationResults["column name validation"] = status_name
        root.info("Finished Column Validation\n")

        # Join Validation
        root.info("Initializing Join Validation")
        status_count_list = []
        status_name_list = []
        
        all_join_input = []
        all_join_output = []

        for i in range(len(all_statements_input)):
            join_list_input,join_list_output, list_join_strings_input, list_join_strings_output = get_join_lists(all_statements_input[i], all_statements_output[i])
            status_count, status_name = False, False
            join_map_input = dict([join_map_input,join_list_input.count(join_map_input)] for join_map_input in set(join_list_input))
            join_map_output = dict([join_map_output,join_list_output.count(join_map_output)] for join_map_output in set(join_list_output))
            jm_input = pprint.pformat(join_map_input)
            jm_output = pprint.pformat(join_map_output)
            root.info(f"Count of Joins in Input in statement {i}: {jm_input}")
            root.info(f"Count of Joins in Output in statement {i}: {jm_output}")

            if jm_input==jm_output:
                status_count = True

            join_list_string_input= log_list_to_string(list_join_strings_input)
            join_list_string_output= log_list_to_string(list_join_strings_output)
            root.info(f"Input(Input) Join List in statement {i}:\n{join_list_string_input}")
            root.info(f"Output(Output) Join List in statement {i}:\n{join_list_string_output}")

            all_join_input += join_list_input
            all_join_output += join_list_output

            status_count_list.append(status_count)
        
        status_count = all(status_count_list)
        new_row["Join Validation"] = generate_count_and_name_output_string("join", all_join_input, all_join_output, status_count, [])
        if status_count:
            status_count = "Success"
            total_success_join_validation+=1
            root.info("Join Validation: Success")
        else:
            status_count = "Failure"
            root.info("Join Validation: Failure")
        finalValidationResults["join count validation"] = status_count
        root.info("Finished Join Validation\n")
        
        # Object Validation
        root.info("Initializing Object Validation")
        status_count_list = []
        status_name_list = []
        
        all_objects_input = []
        all_objects_output = []

        for i in range(len(all_statements_input)):
            table_list_input,table_list_output = get_object_names(all_statements_input[i], all_statements_output[i])
            status_count,status_name = False, False
            if len(table_list_input)==len(table_list_output):
                status_count = True
            if table_list_input == table_list_output:
                status_name = True
            
            root.info("Input Object Count in statement "+ str(i) + ": "+ str(len(table_list_input)))
            root.info("Output Object Count in statement "+ str(i) + ": " + str(len(table_list_output)))

            object_list_string_input= log_list_to_string(table_list_input)
            object_list_string_output= log_list_to_string(table_list_output)
            root.info(f"Input Object List for statement {i}:\n{object_list_string_input}")
            root.info(f"Output Object List for statement {i}:\n{object_list_string_output}")

            status_count_list.append(status_count)
            status_name_list.append(status_name)
            all_objects_input += table_list_input
            all_objects_output += table_list_output
        
        if status_count:
            status_count = "Success"
        else:
            status_count = "Failure"
        
        if status_name:
            status_name = "Success"
            total_success_object_validation+=1
        else:
            status_name = "Failure"

        root.info(f"Object Count Validation: {status_count}")
        root.info(f"Object Name Validation: {status_name}")
        finalValidationResults["object count validation"] = status_count
        finalValidationResults["object name validation"] = status_name
        root.info("Finished Object Validation\n")
        new_row["Object Validation"] = generate_count_and_name_output_string("object", all_objects_input, all_objects_output, status_count, status_name)
        
        # Function Validation
        root.info("Initializing Function Validation")
        status_count_list = []
        status_name_list = []
        
        all_functions_input = []
        all_functions_output = []

        for i in range(len(all_statements_input)):
            fun_list_input,fun_list_output = get_fun_lists(all_statements_input[i], all_statements_output[i],fun)
            status_count = False
            fun_map_input = dict([fun_map_input,fun_list_input.count(fun_map_input)] for fun_map_input in set(fun_list_input))
            fun_map_output = dict([fun_map_output,fun_list_output.count(fun_map_output)] for fun_map_output in set(fun_list_output))
            if fun_map_input==fun_map_output:
                status_count = True
            
            root.info(f"Functions in Input in statement {i}: {fun_map_input}")
            root.info(f"Functions in Output in statement {i}: {fun_map_output}")

            status_count_list.append(status_count)

            all_functions_input += fun_list_input
            all_functions_output += fun_list_output
        
        status_count = all(status_count_list)
        if status_count:
            status_count = "Success"
            total_success_function_validation+=1
        else:
            status_count = "Failure"
        finalValidationResults["function count validation"] = status_count
        new_row["Function Validation"] = generate_count_and_name_output_string("function", all_functions_input, all_functions_output, status_count, [])
        root.info("Finished Function Validation\n")

        # IS NULL Validation
        root.info("Initializing IS NULL Validation")
        status_count_list = []
        status_name_list = []
        
        all_isnulls_input = []
        all_isnulls_output = []

        for i in range(len(all_statements_input)):
            is_null_list_inp,is_not_null_list_inp, is_null_list_out,is_not_null_list_out = get_isnull_lists(all_statements_input[i], all_statements_output[i])
            status_count = False
            if is_null_list_inp==is_null_list_out and is_not_null_list_inp==is_not_null_list_out:
                status_count = True
            
            root.info(f"IS NULLs and IS NOT NULLs in Input in statement {i}: {is_null_list_inp}, {is_not_null_list_inp}")
            root.info(f"IS NULLs and IS NOT NULLs in Output in statement {i}: {is_null_list_out}, {is_not_null_list_out}")

            status_count_list.append(status_count)

            all_isnulls_input += [is_null_list_inp,is_not_null_list_inp]
            all_isnulls_output += [is_null_list_out,is_not_null_list_out]
        
        status_count = all(status_count_list)
        if status_count:
            status_count = "Success"
            total_success_function_validation+=1
        else:
            status_count = "Failure"
        finalValidationResults["is null validation"] = status_count
        new_row["IS NULL Validation"] = generate_count_and_name_output_string("isnull", all_isnulls_input, all_isnulls_output, status_count, [])
        root.info("Finished IS NULL Validation\n")

        # Statement Validation
        root.info("Initializing Statement Validation")
        status_count = "Failure"
        if statementCount_input == statementCount_output:
            status_count = "Success"
            total_success_statement_validation+=1
        root.info(f"No of statements in Input: {statementCount_input}")
        root.info(f"No of statements in Output: {statementCount_output}")
        finalValidationResults["statement count validation"] = status_count
        new_row["Statement Validation"] = "Count Validation: " + str(status_count) + " ( " + (str(statementCount_input)+" | "+str(statementCount_output)) + " ) ; "
        root.info("Finished Statement Validation\n")

        # Dry run for BQ-file
        root.info("Initializing Dry run for BigQuery file")
        dry_run_check,error_message = dry(sqlFile_input)
        if dry_run_check:
            root.info("Dry run was valid, no syntax error found")
            finalValidationResults["dry run check"] = True
            new_row["Dry run"] = "Success"
        else:
            root.info("Found syntax error")
            root.info(f"Error message: {error_message}")
            new_row["Dry run"] = "Syntax error"

        
        # Final Validation Column
        print(finalValidationResults)
        status_final = all(value == "Success" for value in finalValidationResults.values())
        new_row["Validation Results"] = status_final

        # Move log files as either successfull or failed into respective folders
        if status_final:
            success_files = success_files + 1
            root.info("EOF \n\n")
            blob = bucket.blob(f'{validation_output_path}/logs/success_logs/{fName}.log')
            blob.upload_from_filename('std.log')
        else:
            failure_files = failure_files + 1
            root.info("EOF \n\n")
            blob = bucket.blob(f'{validation_output_path}/logs/failure_logs/{fName}.log')
            blob.upload_from_filename('std.log')
        
        # Transpose the row of dataframe to get the desired format
        df2 = pd.DataFrame.from_dict(new_row,orient='index')
        df2 = df2.transpose()
        result = [df,df2]
        df = pd.concat(result,ignore_index=True)
    
    bucket.blob(f'{validation_output_path}/detailed_output/validation_translation_details{ct_start}.csv').upload_from_string(df.to_csv(index=False), 'text/csv')
    bucket.blob(f'{validation_output_path}/result.csv').upload_from_string(df.to_csv(), 'text/csv')
    new_summary_file={}
    ct_end = datetime.datetime.now()
    new_summary_file["Batch_ID"]=f"bqtv_{id}"
    new_summary_file["Total_files_scanned"]=total_files
    new_summary_file["File_Name"]=f'validation_translation_summary{ct_start}'
    new_summary_file["TimeStamp(Validation completed)"]=ct_end
    new_summary_file["Total_Success"]=success_files
    new_summary_file["Total_Failure"]=failure_files
    new_summary_file["Successfull_column_validation"]=total_success_column_validation
    new_summary_file["Successfull_join_validation"]=total_success_join_validation
    new_summary_file["Successfull_object_validation"]=total_success_object_validation
    new_summary_file["Successfull_function_validation"]=total_success_function_validation
    new_summary_file["Successfull_statement_validation"]=total_success_statement_validation
    df3 = pd.DataFrame.from_dict(new_summary_file,orient='index')
    df3=df3.transpose()
    bucket.blob(f'{validation_output_path}/summary/validation_translation_summary{ct_start}.csv').upload_from_string(df3.to_csv(index=False), 'text/csv')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()

    # Take project name and output folder.
    parser.add_argument("-input-path", help="input path for input files directory",default="test-files/test_files_demo/TD_input/")
    parser.add_argument("-bucket", help="bucket name for input files direcrtory",default="bq-translation_validator")
    parser.add_argument("-project-id", help="project id for this to run",default="google.com:sql-parity")
    parser.add_argument("-output-path", help="output path for output files directory",default="test-files/test_files_demo/BQ_output/")
    parser.add_argument("-validation-output-path", help="output path inside the bucket to store the run results",default="validation_output")
    args = parser.parse_args()

    input_path = args.input_path
    bucket_name = args.bucket
    project_id = args.project_id
    output_path = args.output_path
    validation_output_path = args.validation_output_path

    uid = 1
    run_validation(bucket_name, output_path,input_path,validation_output_path ,True, uid)

# Command to run the script
# python3 main.py -input-path=<input_folder_path> -output-path=<output_folder_path>
# eg) python3 main_dag.py
#           -input-path=path/to/input/folder/in/bucket -output-path=path/to/output/folder/in/bucket -bucket=bq-translation_validator
#           -project-id=project_name -validation-output-path=path/to/output/folder/of/main_dag/in/bucket
