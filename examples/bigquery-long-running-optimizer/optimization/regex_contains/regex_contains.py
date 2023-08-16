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
""" Module for recommending using LIKE instead of REGEXP_CONTAINS """

from sqlparse.sql import TokenList, Token

# Global Variables
# 1. lineNumberArr : list of line numbers where REGEXP_CONTAINS is present int the sql input file.
# 2. lineNumber : global variable to record the line number.

def get_fun_count(token):
    global lineNumberArr, lineNumber

    # incrementing the variable by 1, if the token is a new line.
    if str(token) == "\n":
        lineNumber = lineNumber + 1

    # adding the current linenumber to the array.
    if isinstance(token, Token) and str(token)=="REGEXP_CONTAINS" and 'Name' in str(token.ttype):
        lineNumberArr.append(lineNumber)
        return

    if isinstance(token, TokenList) or type(token) is list:
        for tok in token:
            get_fun_count(tok)



def EvalFile(sql_stmt):
    get_fun_count(sql_stmt.tokens)

# Function to loop in through the statement in the sql file 
# and get the result recommendation.
def regex_opt(statements_input):
    global lineNumber, lineNumberArr
    lineNumber = 1
    lineNumberArr = []
    recommendation = []
    for i in statements_input:
        EvalFile(i)
        for entry in lineNumberArr:
            recommendation.append("Found REGEX_CONATINS at line number {0}, this function has a slower execution time. Consider using LIKE instead, particularly if you don't need the full power that REGEXP_CONTAINS provides".format(entry))
    return recommendation
