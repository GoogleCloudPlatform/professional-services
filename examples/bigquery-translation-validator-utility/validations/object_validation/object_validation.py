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
""" Module for identifying objects in input and output files """

from sqlparse.sql import TokenList, IdentifierList, Parenthesis, Identifier, Token
import sqlparse
# Global variables declaration
# 1. check_first_from : Checks the first select encountered
# 2. before_from : are tokens before from
# 3. obj_list : record all the objects encountered
check_first_from=False
obj_list=[]
before_from = False

# Fetch the object names
def get_token_recurse(token):
    global check_first_from, obj_list, before_from
    # After encountering the first from
    if check_first_from and not before_from: 
        # get the indentifierlist or identifier and append to list
        if isinstance(token, IdentifierList) and "(" not in str(token).lower():
            for identifier in token.get_identifiers():
                obj_list.append(str(identifier).upper())
            return

        elif isinstance(token,Identifier)  and "(" not in str(token).lower():
            obj_list.append(str(token).upper())  
            return 
    # check if from is encountered
    if str(token).lower() == 'from':
        check_first_from = True
    else:
        # Check if we dont have a cross join token
        if not isinstance(token, TokenList) and isinstance(token,Token):
            if "keyword" in str(token.ttype).lower() and str(token) not in ["CROSS JOIN"]:
                before_from = True
            else:
                if "whitespace" not in str(token.ttype).lower():
                    before_from = False
        # remove check_first_from if we get a keyword or a parenthesis
        if check_first_from and isinstance(token, Token) and ("keyword" in str(token.ttype).lower() or isinstance(token,Parenthesis)):
            if str(token) not in ["CROSS JOIN"]:
                check_first_from = False

    if (isinstance(token, TokenList) or type(token) is list):
        for tok in token:
            get_token_recurse(tok)

# In sqlparse, the objects are also identifiers
def get_topic_array():
    arr = []
    for object_identifier in obj_list:
        # get the object name
        obj_name = str(object_identifier).split()[0]
        # Check for multiple dots and get the last string after dot
        if '.' in str(object_identifier):
            arr.append(str(obj_name).split('.')[-1].upper())
    return arr



def EvalFile(stmt):
    global obj_list, check_first_select
    check_first_select=False
    get_token_recurse(stmt.tokens)
    arr=[]
    arr = get_topic_array()
    obj_list = []
    return arr
    
# Object processing
def get_object_names(statement1,statement2):
    try:
        object_list1 = EvalFile(statement1)
        object_list2 = EvalFile(statement2)
        return object_list1,object_list2
    except:
        print("error in file above")
        return [],[]

# Testing code. Only uncomment if required
def get_table(file1):
    fd1 = open(file1,'r')
    sqlFile1 = fd1.read()
    fd1.close()
    statements1 = sqlparse.parse(sqlFile1)[0]
    table_list = EvalFile(statements1)
    print((table_list))
    return table_list


def test_a_file(file):
    terradata_folder_path = "/Users/rishabkhawad/validation_utility/test_files/test_files_1/TD_input/"
    bigquery_folder_path = "/Users/rishabkhawad/validation_utility/test_files/test_files_1/BQ_output/"
    get_table(terradata_folder_path + file)
    get_table(bigquery_folder_path + file)

# file = "IDWOPSDM_PROD_VIEWS.C_CAMM_DIV_EVNT_DAY_G.sql"
# file = "TRADES_RTL_HH.sql"
# file = "IDW_ADMIN.F_ASSET_DQ_CHECK_TPI_G.sql"
# test_a_file(file)