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
""" Module for validating BQ tranlation """

import pandas as pd
import os
from validations.column_validation.column_validation import get_column_lists
from validations.join_validation.join_validation import get_join_lists
from validations.object_validation.object_validation import get_object_names
from validations.functions_validation.functions_validation import get_fun_lists
from validations.line_count.line_count import get_line_count
from validations.dry_run.dry_run import dry
from validations.isnull_validation.isnull_validation import get_isnull_lists
from utils.utils import generate_count_and_name_output_string,remove_multiple_whitespaces,retrieve_view_create_statement,log_list_to_string,formatNewLines
import sqlparse
import logging
import pprint
import argparse
import shutil
import uuid
import datetime
 
# Take in Arguments for test and output folder
parser = argparse.ArgumentParser()
parser.add_argument("-input-path", help="input path for input files directory",default="test_files/test_files_0/TD_input/")
parser.add_argument("-output-path",help="input path for output files directory",default="test_files/test_files_0/BQ_output/")
args = parser.parse_args()
input_folder_path = args.input_path
output_folder_path = args.output_path

# Console logging
print("Starting Processing")
print("\t* Logs are stored std.log in the root directory of the project")
print("\t* Results are stored validation-translation.xlsx in the root directory of the project")

# Fetch the function list and store in a Set
data = pd.read_csv('config/functions.csv')   
listf=data['FunctionName'].tolist()
fun=set([])
for func in listf:
    fun.add(func.upper())

# Function to iterate over the input and output folders
def iterate(input_files,output_files):
    files1 = os.listdir(input_files)
    files1.sort()
    files2 = os.listdir(output_files)
    files2.sort()

    # Only compare the files with common names in the 2 folders.
    common_files = [file for file in files1 if file in files2]
    return common_files

# declare the excel dataframe which will have aggregate data
df = pd.DataFrame()

# Track the total success and failures
success_files = 0
failure_files = 0


# Initialize Log file directories
newpaths = ['log_files/successful_logs', 'log_files/failed_logs']
for newpath in newpaths:
    if not os.path.exists(newpath):
        os.makedirs(newpath)
    else:
        shutil.rmtree(newpath)
        os.makedirs(newpath)

id=uuid.uuid4()
# Iterate over each common file in the input and output directories
for fName in iterate(input_folder_path,output_folder_path):
    # Add time based logs and log formats
    logging.basicConfig(filename="std.log", filemode='w',format='%(asctime)s %(levelname)-8s %(message)s',level=logging.INFO,datefmt='%Y-%m-%d %H:%M:%S',force=True)
    root = logging.getLogger()
    root.info("Initializing SQL Validation\n\n")
    root.info("********* Processing "+ str(fName)+ " **********\n")

    file_name = fName.split('.sql')[0]

    # Read the file contents
    fd1 = open(input_folder_path + fName,'r')
    sqlFile_input = fd1.read()   
    fd1.close()

    fd2 = open(output_folder_path + fName,'r')
    sqlFile_output = fd2.read()
    fd2.close()
    
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
        "dry run validation" : False,
    }

    # Clean the comments
    sqlFile_input = sqlparse.format(sqlFile_input, strip_comments=True).strip()
    sqlFile_output = sqlparse.format(sqlFile_output, strip_comments=True).strip()

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
    statement_count_input,statement_count_output = len(statements_input),len(statements_output)

    # Error in identifying SQL statements
    if len(statements_input)<=0 or len(statements_output) <=0:
        root.warning("Could not parse the statements for the file : ", fName)
        continue

    # Check if the files have mutliple statements and get the view statement
    all_statements_input=statements_input
    all_statements_output=statements_output

    statements_input=retrieve_view_create_statement(statements_input)
    statements_output=retrieve_view_create_statement(statements_output)
    
    # Add the FileName and BatchId to the dataframe
    new_row["Batch_ID"] = id
    new_row["FileName"] = fName

    # Line count
    root.info("Initializing Line Count Validation")
    lines_input,lines_output,percentage_diff = get_line_count(input_folder_path + fName,output_folder_path + fName)
    if percentage_diff>=0:
        percentage_difference = '+'+str(percentage_diff)
    else:
        percentage_difference = str(percentage_diff)
    new_row["Line Count"] = str(str(lines_input)+'|'+str(lines_output)+'|'+percentage_difference+"%")
    root.info("Input(Input) Line Count: "+ str(lines_input))
    root.info("Output(Output) Line Count: "+ str(lines_output))
    root.info("Percentage Difference = "+ str(percentage_difference) + "%\n")
    root.info("Finished Line Count Validation\n")

    # Column Validation
    root.info("Initializing Column Validation")
    status_count_list = []
    status_name_list = []
    
    all_column_input = []
    all_column_output = []

    for i in range(len(all_statements_input)):
        col_list_input,col_list_output = get_column_lists(all_statements_input[i], all_statements_output[i])
        status_count, status_name = False, False

        root.info("Input(Input) Column Count for statement " + str(i) + ": "+ str(len(col_list_input)))
        root.info("Output(Output) Column Count for statement " + str(i) + ": " + str(len(col_list_output)))
        if len(col_list_output)==len(col_list_input):
            status_count = True
        root.info(f"Columns Count Validation for statement "+ str(i) + f": {status_count}")
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
        if join_map_input==join_map_output:
            status_count = True
        jm_input = pprint.pformat(join_map_input)
        jm_output = pprint.pformat(join_map_output)
        root.info(f"Count of Joins in Input in statement {i}: {jm_input}")
        root.info(f"Count of Joins in Output in statement {i}: {jm_output}")

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
        table_list_input,table_list_output = get_object_names(statements_input,statements_output)
        status_count,status_name = False, False
        if len(table_list_input)==len(table_list_output):
            status_count = True
        if table_list_input == table_list_output:
            status_name = True
        
        root.info("Input(Input) Object Count in statement "+ str(i) + ": "+ str(len(table_list_input)))
        root.info("Output(Output) Object Count in statement "+ str(i) + ": " + str(len(table_list_output)))

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
        fun_list_input,fun_list_output = get_fun_lists(statements_input,statements_output,fun)
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
    else:
        status_count = "Failure"
    finalValidationResults["isnull count validation"] = status_count
    new_row["IS NULL Validation"] = generate_count_and_name_output_string("isnull", all_isnulls_input, all_isnulls_output, status_count, [])
    root.info("Finished IS NULL Validation\n")

    # Statement Validation
    root.info("Initializing Statement Validation")
    status_count = "Failure"
    if statement_count_input == statement_count_output:
        status_count = "Success"
    root.info(f"No of statements in Input: {statement_count_input}")
    root.info(f"No of statements in Output: {statement_count_output}")
    finalValidationResults["statement count validation"] = status_count
    new_row["Statement Validation"] = generate_count_and_name_output_string("statement",[statement_count_input],[statement_count_output],status_count,[])
    root.info("Finished Statement Validation\n")
    # Dry run for BQ-files
    dry_run_check = dry(sqlFile_input)
    if dry_run_check:
        finalValidationResults["dry run check"] = True
        new_row["dry run"] = "Success"
    else:
        new_row["dry run"] = "Syntax error"

    # Final Validation Column
    status_final = all(value == "Success" for value in finalValidationResults.values())
    new_row["Validation Results"] = status_final

    # Move log files as either successful or failed into respective folders
    if status_final:
        success_files = success_files + 1
        root.info("EOF \n\n")
        shutil.move("std.log","log_files/successful_logs/" + file_name +".log")
    else:
        failure_files = failure_files + 1
        root.info("EOF \n\n")
        shutil.move("std.log","log_files/failed_logs/" + file_name +".log")
    
    # Transpose the row of dataframe to get the desired format
    df2 = pd.DataFrame.from_dict(new_row,orient='index')
    df2 = df2.transpose()
    result = [df,df2]
    df = pd.concat(result,ignore_index=True)

# Declare a pandas writer with xlsxwriter engine. This helps to format the pandas excel.
df.to_csv('validation-translation.csv', index=False)
writer= pd.ExcelWriter("validation-translation.xlsx", engine= "xlsxwriter")
df.to_excel(writer, index=False, startrow = 5,sheet_name= "Report")

# extract the worksheet and workbook
workbook = writer.book
worksheet = writer.sheets["Report"]
# Declare the formats
fmt_header = workbook.add_format({
 'bold': True,
 'text_wrap': True,
 'valign': 'top',
 'fg_color': '#5DADE2',
 'font_color': '#FFFFFF',
 'border': 1})

border_fmt = workbook.add_format({
    'border' : 1
})
new_summary_file={}
# batch_id=1
# new_summary_file['batch_id']=batch_id
# ct stores current time
ct = datetime.datetime.now()
new_summary_file["Batch_ID"]=id
new_summary_file["TimeStamp"]=ct
new_summary_file["Success"]=success_files
new_summary_file["Failure"]=failure_files
df3 = pd.DataFrame.from_dict(new_summary_file,orient='index')
df3=df3.transpose()
df3.to_csv('batch-report.csv', index=False)
# Apply the fomatting to the desired range of cells
worksheet.write(0, 2, "Final Delivery Status", fmt_header)
worksheet.write(0, 3, "Count", fmt_header)
worksheet.write(1, 2, "Success", fmt_header)
worksheet.write(2, 2, "Failure", fmt_header)
worksheet.write(1, 3, success_files, border_fmt)
worksheet.write(2, 3, failure_files, border_fmt)

for col , value in enumerate(df.columns.values):
    worksheet.write(5, col, value, fmt_header)         

# Save the excel
writer.save()


print("Processing Completed")

# Command to run the script
# python3 main.py -input-path=<input_folder_path> -output-path=<output_folder_path>
# eg) python3 main.py
#           -input-path=test_files/input-folder -output-path=test_files/output-folder
