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
""" Module for identifying IS NULL and IS NOT NULL in input and output files """

from sqlparse.sql import Token, TokenList
from utils.utils import is_tokenlist_or_list

is_encountered = False

is_null = 0
is_not_null = 0

# Recurse over the tokens to find is_null or is_not_null
def isnull_recurse(token):
    global is_encountered, is_null, is_not_null

    # Dont consider whitespace
    if isinstance(token, Token) and "whitespace" in str(token.ttype).lower():
        return

    # Check if there is is null or is not null
    if (not isinstance(token, TokenList)) and is_encountered :
        if str(token).lower() == "null":
            is_null+=1
        elif str(token).lower() == "not null":
            is_not_null +=1
        is_encountered = False

    # start recording for is null or is not null
    if isinstance(token, Token) and str(token).lower() == "is":
        is_encountered = True


    if is_tokenlist_or_list(token):
        for tok in token:
            isnull_recurse(tok)

# Get the is_null or is_not_null
def EvalFile(stmt):
    global is_encountered, is_null, is_not_null

    is_encountered = False
    is_null = 0
    is_not_null = 0

    isnull_recurse(stmt.tokens)
    

    return is_null, is_not_null
    
# Is null processing
def get_isnull_lists(statements1, statements2):
    is_null_list1,is_not_null_list1 = EvalFile(statements1)
    is_null_list2,is_not_null_list2  = EvalFile(statements2)

    return is_null_list1,is_not_null_list1, is_null_list2,is_not_null_list2
