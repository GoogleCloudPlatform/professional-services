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
""" Module for recommending to avoid self joins """

from sqlparse.sql import Identifier, TokenList, Token

# Global Variables
# 1. lineNumber :  global variable to record the line number.
# 2. check_for_self_join : Is a boolean variable, it is set to True if self join is found.
# 3. inside_from : Is a boolean variable. Value "True" denotes that we just encountered "from" keyword.
# 4. inside_join : Is a boolean variable. Value "True" denotes that we just encountered "join" keyword.
# 5. rhs_tbl_name : Holds the value of the table name used in "from" query.
# 6. dict_for_tbl : Key value pair, where key is set the value in rhs_tbl_name and corresponding value is a list of line numbers.


# returns true if the token is  "FROM"
def check_from(token):
    return isinstance(token, Token) and 'Keyword' in str(token.ttype) and 'FROM' in str(token).upper()

# returns true if the token is  "JOIN"
def check_join(token):
    return isinstance(token, Token) and 'JOIN' in str(token).upper() and 'Keyword' in str(token.ttype)

# returns true if the token is  "SELECT"
def is_select(token):
    return isinstance(token, Token) and 'SELECT' in str(token).upper() and 'DML' in str(token.ttype)


def get_self_join_count(token):
    global inside_from, inside_join, rhs_tbl_name, check_for_self_join, lineNumber, dict_for_tbl

    # incrementing the variable by 1, if the token is a new line.
    if str(token) == "\n":
        lineNumber = lineNumber + 1
    
    # update the dictionary if self join condition is True.
    if check_for_self_join:
        if isinstance(token, Identifier) and rhs_tbl_name!="":
            tbl_ = str(token).split()
            tbl_ = tbl_[0]
            if str(tbl_) == str(rhs_tbl_name):
                    if str(tbl_) not in dict_for_tbl:
                        # create a new key with value set to empty list
                        dict_for_tbl[str(tbl_)] =  []
                        dict_for_tbl[str(tbl_)].append(lineNumber)
                    else:
                        # update the value of the key
                        dict_for_tbl[str(tbl_)].append(lineNumber)

    # set variables to False, if token is a "select" keyword
    if (inside_from or inside_join) and is_select(token):
        inside_from = False
        inside_join = False
        check_for_self_join = False
        rhs_tbl_name = ""

    # get the table name on the right hand side of the self join.
    if inside_from:
        if isinstance(token, Identifier) and rhs_tbl_name=="":
            tbl_ = str(token).split()
            rhs_tbl_name = tbl_[0]

    if check_from(token):
        inside_from = True

    if check_join(token) and inside_from:
        inside_join = True
        check_for_self_join = True

    if isinstance(token, TokenList) or type(token) is list:
        for tok in token:
            get_self_join_count(tok)


def EvalFile(sql_stmt):
    get_self_join_count(sql_stmt.tokens)


# Function to loop in through the statement in the sql file 
# and get the result recommendation.
def self_join(statements_input):
    global lineNumber, check_for_self_join, inside_from, inside_join, rhs_tbl_name, dict_for_tbl
    check_for_self_join = False
    inside_from = False
    inside_join = False
    rhs_tbl_name = ""
    lineNumber = 1
    recommendation = []
    dict_for_tbl = {}

    for i in statements_input:
            EvalFile(i)
            print(dict_for_tbl)
            for key, value in dict_for_tbl.items():
                for lineNum in value:
                    desc = "Avoid using self join on table {0} at line number {1}.".format(key, lineNum)
                    recommendation.append(desc)
    
    return recommendation