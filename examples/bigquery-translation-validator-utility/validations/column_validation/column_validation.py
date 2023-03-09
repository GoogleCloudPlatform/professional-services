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
""" Module to identify the columns in view statement """

import re
from sqlparse.sql import IdentifierList, Parenthesis, Identifier, Function
from utils.utils import *

# Global variables declaration
# 1. check_first_select : Checks the first select encountered
# 2. check_break : Used to break the recursion
# 3. column list : record all the columns encountered in first select
check_first_select=False
check_break=False
col_list=[]

# recurse over the SQL to find column lists in the first select
def get_column_recurse(token):
    global check_first_select, check_break, col_list, got_first_identifierlist
    # break the recursion
    if check_break is True:
        return
    # check for the first select statement
    if check_first_select is True:
        if isinstance(token, Function):
            return
        # the tokenlist type of sqlparse does not have ttype. This ensures we are at a single element in the recursion.
        if (token.ttype is None):
            # Columns are usually are in a form of an Identifier list
            if isinstance(token, IdentifierList):
                # If identifier, add to the global column list
                got_first_identifierlist = True
                for identifier in token.get_identifiers():
                    col_list.append(identifier)
                return
                
            # If there is a single column, it is of type Indentifier
            elif isinstance(token, Identifier):
                col_list.append(token)
                return
            # In Teradata, named keyword is used for alias for column list
            elif isinstance(token, Parenthesis):
                if 'named' in str(token).lower():
                    col_list.append(token)
                return
    # Set the check first select as true if we get the first select. In teradata sel is a keyword same as select
    if is_token_word(token, 'select') or is_token_word(token, 'sel'):
        if check_first_select is False:
            check_first_select = True
    # Break when 'from is encountered'
    if is_token_word(token, 'from'):
        check_break=True
        return
    # iterate over the tokenlists or list
    if is_tokenlist_or_list(token):
        for tok in token:
            get_column_recurse(tok)

# This is Teradata specific for name cleaning
def pre_process_names(nm):
    if 'named' in nm:
        chck=nm.split("named")
        return re.match(r'\W*(\w[^,. !?"]*)', chck[1]).groups()[0]
    elif 'NAMED' in nm:
        chck=nm.split("NAMED")
        return re.match(r'\W*(\w[^,. !?"]*)', chck[1]).groups()[0]
    return None

# Process column names for a single file
def EvalFile(stmt):
    # reset the globals for each run
    global col_list, check_first_select, check_break
    check_first_select=False
    check_break=False

    # populates col_list
    get_column_recurse(stmt.tokens)

    # Fill the array with name cleaned column names
    arr=[]
    for column_identifier in col_list:
        c = pre_process_names(str(column_identifier))
        if c is None:
            try:
                if isinstance(column_identifier, Function):
                    continue
                arr.append(column_identifier.get_name().lower())
            except:
                continue
        else:
            arr.append(c.lower())
    col_list=[]
    return arr

# Call file processing and process the outputs to return to main
def get_column_lists(statements1, statements2):
    cols_list1 = EvalFile(statements1)
    cols_list2 = EvalFile(statements2)
    cols_list1.sort()
    cols_list2.sort()
    cols_list1 = list(dict.fromkeys(cols_list1))
    cols_list2 = list(dict.fromkeys(cols_list2))
    return cols_list1,cols_list2