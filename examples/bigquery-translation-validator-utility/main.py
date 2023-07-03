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
from utils.utils import formatNewLines, remove_multiple_whitespaces, retrieve_view_create_statement, generate_count_and_name_output_string, log_list_to_string 
import sqlparse
import logging
import pprint
import argparse
import shutil

# Take in Arguments for test and output folder
parser = argparse.ArgumentParser()
parser.add_argument("-input-path", help="input path for input files directory",default="test_files/test_files_1/TD_input/")
parser.add_argument("-output-path",help="input path for output files directory",default="test_files/test_files_1/BQ_output/")
args = parser.parse_args()
terradata_folder_path = args.input_path
bigquery_folder_path = args.output_path

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
def iterate(terradata,bigquery):
    files1 = os.listdir(terradata)
    files1.sort()
    files2 = os.listdir(bigquery)
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

# Iterate over each common file in the input and output directories
for fName in iterate(terradata_folder_path,bigquery_folder_path):
    # Add time based logs and log formats
    logging.basicConfig(filename="std.log", filemode='w',format='%(asctime)s %(levelname)-8s %(message)s',level=logging.INFO,datefmt='%Y-%m-%d %H:%M:%S',force=True)
    root = logging.getLogger()
    root.info("Initializing Teradata SQL to Bigquery SQL Validation\n\n")
    root.info("********* Processing "+ str(fName)+ " **********\n")

    file_name = fName.split('.sql')[0]

    # Read the file contents
    fd1 = open(terradata_folder_path + fName,'r')
    sqlFile_input = fd1.read()   
    fd1.close()

    fd2 = open(bigquery_folder_path + fName,'r')
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

    # Error in identifying SQL statements
    if len(statements_input)<=0 or len(statements_output) <=0:
        root.warning("Could not parse the statements for the file : ", fName)
        continue

    # Check if the files have mutliple statements and get the view statement
    statements_input=retrieve_view_create_statement(statements_input)
    statements_output=retrieve_view_create_statement(statements_output)
    
    # Add the FileName to the dataframe
    new_row["FileName"] = fName

    # Line count
    root.info("Initializing Line Count Validation")
    lines_td,lines_bq,percentage_diff = get_line_count(terradata_folder_path + fName,bigquery_folder_path + fName)
    if percentage_diff>=0:
        percentage_difference = '+'+str(percentage_diff)
    else:
        percentage_difference = str(percentage_diff)
    new_row["Line Count"] = str(str(lines_td)+'|'+str(lines_bq)+'|'+percentage_difference+"%")
    root.info("Input(TD) Line Count: "+ str(lines_td))
    root.info("Output(BQ) Line Count: "+ str(lines_bq))
    root.info("Percentage Difference = "+ str(percentage_difference) + "%\n")
    root.info("Finished Line Count Validation\n")

    # Column Validation
    root.info("Initializing Column Validation")
    col_list_TD,col_list_BQ = get_column_lists(statements_input, statements_output)
    status_count,status_name = "Failure","Failure"
    root.info("Input(TD) Column Count: "+ str(len(col_list_TD)))
    root.info("Output(BQ) Column Count: "+ str(len(col_list_BQ)))
    if len(col_list_BQ)==len(col_list_TD):
        status_count = "Success"
    root.info(f"Columns Count Validation: {status_count}")
    if (col_list_TD == col_list_BQ):
        status_name = "Success"
    # String cleaning for Excel results.
    new_row["Column Validation"] = generate_count_and_name_output_string("column", col_list_TD, col_list_BQ, status_count, status_name)
    # Format the log string to show in form of an indexed list
    col_list_string_TD= log_list_to_string(col_list_TD)
    col_list_string_BQ= log_list_to_string(col_list_BQ)
    root.info(f"Input Column List:\n{col_list_string_TD}")
    root.info(f"Output Column List:\n{col_list_string_BQ}")
    root.info(f"Columns Name Validation: {status_name}")
    # Set the Final Validation status
    finalValidationResults["column count validation"] = status_count
    finalValidationResults["column name validation"] = status_name
    root.info("Finished Column Validation\n")

    # Join Validation
    root.info("Initializing Join Validation")
    # join validation returns the list of joins and the columns corresponding to these
    Join_list_TD,Join_list_BQ,list_join_strings_TD,list_join_strings_BQ = get_join_lists(statements_input, statements_output)
    status_count = "Failure"
    join_map_input = dict([join_map_input,Join_list_TD.count(join_map_input)] for join_map_input in set(Join_list_TD))
    join_map_output = dict([join_map_output,Join_list_BQ.count(join_map_output)] for join_map_output in set(Join_list_BQ))
    jm_input = pprint.pformat(join_map_input)
    jm_output = pprint.pformat(join_map_output)
    root.info(f"Count of Joins in Input: {jm_input}")
    root.info(f"Count of Joins in Output: {jm_output}")
    if join_map_input==join_map_output:
        status_count = "Success"
        root.info("Join Validation: Success")
    else:
        root.info("Join Validation: Failure")
    new_row["Join Validation"] = generate_count_and_name_output_string("join", Join_list_TD, Join_list_BQ, status_count, [])
    join_list_string_TD= log_list_to_string(list_join_strings_TD)
    join_list_string_BQ= log_list_to_string(list_join_strings_BQ)
    root.info(f"Input(TD) Join List:\n{join_list_string_TD}")
    root.info(f"Output(BQ) Join List:\n{join_list_string_BQ}")
    root.info("Finished Join Validation\n")
    finalValidationResults["join count validation"] = status_count

    # Object Validation
    root.info("Initializing Object Validation")
    table_list_TD,table_list_BQ = get_object_names(statements_input,statements_output)
    status_count,status_name = "Failure","Failure"
    if len(table_list_TD)==len(table_list_BQ):
        status_count = "Success"
    if table_list_TD == table_list_BQ:
        status_name = "Success"
    new_row["Object Validation"] = generate_count_and_name_output_string("object", table_list_TD, table_list_BQ, status_count, status_name)
    root.info("Input(TD) Object Count: "+ str(len(table_list_TD)))
    root.info("Output(BQ) Object Count: "+ str(len(table_list_BQ)))
    root.info(f"Object Count Validation: {status_count}")
    object_list_string_TD= log_list_to_string(table_list_TD)
    object_list_string_BQ= log_list_to_string(table_list_BQ)
    root.info(f"Input Object List:\n{object_list_string_TD}")
    root.info(f"Output Object List:\n{object_list_string_BQ}")
    root.info(f"Object Name Validation: {status_name}")
    root.info("Finished Object Validation\n")
    finalValidationResults["object count validation"] = status_count
    finalValidationResults["object name validation"] = status_name

    # #Function Validation
    root.info("Initializing Function Validation")
    # get fun lists also takes the function set as input
    fun_list_TD,fun_list_BQ = get_fun_lists(statements_input,statements_output,fun)
    status_count = "Failure"
    fun_map_input = dict([fun_map_input,fun_list_TD.count(fun_map_input)] for fun_map_input in set(fun_list_TD))
    fun_map_output = dict([fun_map_output,fun_list_BQ.count(fun_map_output)] for fun_map_output in set(fun_list_BQ))
    if fun_map_input==fun_map_output:
        status_count = "Success"
    root.info(f"Functions in Input: {fun_map_input}")
    root.info(f"Functions in Output: {fun_map_output}")
    new_row["Function Validation"] = generate_count_and_name_output_string("function", fun_list_TD, fun_list_BQ, status_count, [])
    finalValidationResults["function count validation"] = status_count
    root.info("Finished Function Validation\n")

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

