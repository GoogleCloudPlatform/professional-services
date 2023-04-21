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
""" Module for recommending selecting only needed columns """

from sqlparse.sql import TokenList, Token, Identifier
import re

# Function to recurse over the tokens and get a list of Select projections.
def get_fun_count(token):
    global in_select, res_list, punct_enc

    if punct_enc and 'Whitespace' in str(token.ttype):
        punct_enc = False

    # check whether the token is "select"
    if isinstance(token, Token) and str(token).lower() == "select":
        in_select=True

    #check whether the token is "from"
    if isinstance(token, Token) and str(token).lower() == "from":
        in_select=False
        
    # Token-- . , Type-- Token.Punctuation
    # <TEMP_TBALE>.* 
    if str(token) == '.' and 'Punctuation' in str(token.ttype):
        punct_enc = True
    
    # Checking for wildcard * and pattern of type <TEMP_TABLE>.* after select statement.
    if in_select and 'whitesapce' not in str(token.ttype).lower():
     
        if not isinstance(token, TokenList):
            pass
        # if the projection is of the form select *.
        if "Wildcard" in str(token.ttype) and '*' in str(token) and not punct_enc:
            # adding to the result list
            res_list.append("select *")

        # if the token that is being recursed is of the form <TEMP_TBALE>.* , then setting the variable to False.
        elif "Wildcard" in str(token.ttype) and '*' in str(token) and punct_enc:
            punct_enc = False

        # if the projection is of the form select <TEMP_TBALE>.*,
        elif isinstance(token, Token) and isinstance(token, Identifier):
            pattern = '^[a-zA-Z0-9_]+\.\*[,]?'
            res = re.match(pattern, str(token))
            if res:
                # adding to the result list
                res_list.append("select "+ str(token))
    
    # iterate over lists and tokenlists
    if isinstance(token, TokenList) or type(token) is list:
        for tok in token:
            get_fun_count(tok)

# Getting the tokens from the sql statement
def EvalFile(stmt):
    get_fun_count(stmt.tokens)


def select_optimize(sql_parsed):
    global res_list, in_select, punct_enc
    res_list = []
    in_select = False
    punct_enc = False
    EvalFile(sql_parsed)
    return res_list

# Function to loop in through the statement in the sql file 
# and get the result recommendation.
def consolidated_select_optimize(statements_input):
    select_result_fin = []
    for i in statements_input:
            select_result = select_optimize(i)
            if len(select_result)>0:
                for res in select_result:
                    select_result_fin.append(res)
    return select_result_fin