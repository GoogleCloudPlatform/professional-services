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
""" Module recommending to avoid cross joins """

from sqlparse.sql import Token, Function
from utils_optimization.utils_optimization import is_token_word, is_token_cross_join, is_token_keyword, is_tokenlist_or_list

# Global Variables
# 1. check_in_from : Check if token is in the from statement till next keyword.
# 2. from_string : Accounts for the string in from_string
# 3. cross_joins : Total number of cross joins
# 4. comma_cross_joins_line_number : Line number of cross joins denoted by comma
# 5. parenthesis_check : Account for stack of parenthesis and increment the line number
# 6. check_in_join : Check if token is inside join till next keyword.
# 7. lineNumber : global variable to record the line number of the token

check_in_from=False
from_string=""
cross_joins=0

comma_cross_joins_line_number = []
parenthesis_check = []

check_in_join = False

lineNumber = 1

# Go over the tokens and fetch the joins and count
def get_cross_join_recurse(token):
    global lineNumber

    if str(token) == "\n":
        lineNumber = lineNumber + 1

    # checks if the token is a union or join
    if isinstance(token, Token) and token.ttype != None and is_token_cross_join(token) and is_token_keyword(token):
        return [lineNumber]
    
    # Recurse if the token is tokenlist or of type of list
    if is_tokenlist_or_list(token):
        arrList=[]
        for tok in token:
            joins=get_cross_join_recurse(tok)
            # add the results of sub-recursion and return to arrList
            if len(joins) > 0:
                arrList=arrList+joins
        return arrList
    else:
        return []

# Finds the cross joins that are denoted by a comma
def check_cross_join_with_comma(token):
    global check_in_from, from_string, cross_joins, comma_cross_joins_line_number, lineNumber, parenthesis_check

    # Increment line number with each new line
    if str(token) == "\n":
        lineNumber = lineNumber + 1

    # If the token inside from statement
    if check_in_from:
        # Append to the parenthesis check
        if str(token) == "(":
            parenthesis_check.append('(')
        
        # If parenthesis is ending
        if str(token) == ")":
            # Is length of parenthesis check is 0, the subquery is ending.
            if len(parenthesis_check) == 0 :
                # Hop out of from and append to cross joins. Record the Line number
                check_in_from = False
                parenthesis_check = []
                if ',' in from_string:
                    cross_joins=cross_joins+1
                    comma_cross_joins_line_number.append(lineNumber)
                from_string = ""
                return
            else:
                # Remove from stack.
                parenthesis_check = parenthesis_check[:-1]
        

    # Check if we are in a from and append to the from_string
    if not is_tokenlist_or_list(token) and check_in_from is True:
        from_string=from_string+" " +str(token)
    # Check if we encountered a from
    if is_token_word(token, 'from'):
            check_in_from = True
    
    # if we get a keyword after from, check comma in from_string and reset the from_string. This is a cross join.
    elif (is_token_keyword(token) and not is_token_word(token, 'as')) or isinstance(token, Function) or str(token) == ";":
        if check_in_from:
            check_in_from=False
            parenthesis_check = []
            if ',' in from_string:
                cross_joins=cross_joins+1
                comma_cross_joins_line_number.append(lineNumber)
            from_string=""
        return
    
    if is_tokenlist_or_list(token):
        for tok in token:
            check_cross_join_with_comma(tok)

# Function to return recommendation for cross joins with line number.
def all_cross_joins(statements_input):
    global lineNumber, comma_cross_joins_line_number
    lineNumber = 1
    parsedStatements = statements_input
    recommendation = []

    # Get recommendations for cross joins keywords
    for ele in parsedStatements:
        arr = get_cross_join_recurse(ele.tokens)
        for ele in arr:
            recommendation.append("Please avoid using CROSS JOIN on line "+ str(ele))
    
    # Get recommendations for cross joins denoted by a comma
    lineNumber = 1
    for ele in parsedStatements:
        check_cross_join_with_comma(ele.tokens)
        if "," in from_string:
            comma_cross_joins_line_number.append(lineNumber)

    for ele in comma_cross_joins_line_number:
        recommendation.append("Please avoid using comma based CROSS JOIN on line "+ str(ele))

    # return the recommendations
    return recommendation
