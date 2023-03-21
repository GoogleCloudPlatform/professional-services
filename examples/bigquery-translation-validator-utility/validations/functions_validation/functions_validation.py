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
""" Module for identifying functions in input and output files """

from sqlparse.sql import Function
from utils.utils import is_tokenlist_or_list

# Find the function count for the functions in the set.
def get_fun_count(token,fun):
    got_function = False
    # Check if the token is a function
    if (isinstance(token, Function)):
        got_function=True
    
    # iterate over lists and tokenlists
    if is_tokenlist_or_list(token):
        arrList=[]
        # Check if we got a function and it is in the set
        if (got_function and (str(token[0]).upper() in fun)):
            arrList.append(str(token[0]).upper())
        for tok in token:
            funcs=get_fun_count(tok,fun)
            if len(funcs) > 0:
                # Array is built during recursion
                arrList=arrList+funcs
        return arrList
    # return empty if we dont get any functions
    return []

# Process functions for a single file
def EvalFile(stmt,fun):
    lst = get_fun_count(stmt.tokens,fun)
    return lst

# function lists return to main
def get_fun_lists(statements1, statements2, fun):
    cols_list1 = EvalFile(statements1, fun)
    cols_list2 = EvalFile(statements2, fun)
    cols_list1.sort()
    cols_list2.sort()
    return cols_list1,cols_list2