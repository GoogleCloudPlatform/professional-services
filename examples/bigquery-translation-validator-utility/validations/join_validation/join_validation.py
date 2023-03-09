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
""" Module for identifying joins in input and output files """

from sqlparse.sql import Token, Function
from utils.utils import *

# Global variables declaration
# 1. check_in_from : Used for finding cross joins in form of a comma.
# 2. from_string : Get the full from string. FROM tab1,tab2 means 1 cross join.
# 3. cross_joins : number of cross joins.
# 4. check_in_join : check if we encountered join. Used to see the column names.
# 5. join_string : string from a join to the next keyword.
# 6. current_join : the join for which join_string is made
# 7. list_join_strings : append to the join strings with objects.
check_in_from=False
from_string=""
cross_joins=0

check_in_join = False
join_string=""
current_join = ""
list_join_strings= []

# Go over the tokens and fetch the joins and count
def get_join_recurse(token):
    # checks if the token is a union or join
    if isinstance(token, Token) and token.ttype != None and is_token_join_or_union(token) and is_token_keyword(token):
        # Consider Outer and Inner joins and convert to join
        if is_token_outer_join(token):
            join_nm = str(token).lower().replace("outer join", "join")
            return [join_nm.upper()]
        elif is_token_inner_join(token):
            join_nm = str(token).lower().replace("inner join", "join")
            return [join_nm.upper()]
        return [str(token).upper()]
    if is_tokenlist_or_list(token):
        arrList=[]
        for tok in token:
            joins=get_join_recurse(tok)
            if len(joins) > 0:
                arrList=arrList+joins
        return arrList
    else:
        return []

# Finds the cross joins that are denoted by a comma
def check_cross_join_with_comma(token):
    global check_in_from, from_string, cross_joins
    # Check if we are in a from and append to the from_string
    if not is_tokenlist_or_list(token) and check_in_from is True:
        from_string=from_string+" " +str(token)
    # Check if we encountered a from
    if is_token_word(token, 'from'):
            check_in_from = True
    
    # if we get a keyword after from, check comma in from_string and reset the from_string. This is a cross join.
    elif (is_token_keyword(token) and not is_token_word(token, 'as')) or is_token_word(token, 'sel') or isinstance(token, Function):
        if check_in_from:
            check_in_from=False
            if ',' in from_string:
                list_join_strings.append("CROSS JOIN:"+from_string)
                cross_joins=cross_joins+1
            from_string=""
        return
    if is_tokenlist_or_list(token):
        for tok in token:
            check_cross_join_with_comma(tok)

# Get the strings after join. If there are object names after join capture these, if subquery, capture the first keyword
def get_join_strings(token):
    global check_in_join, join_string, list_join_strings, current_join

    # Save time by skipping whitespaces and newlines
    if not is_tokenlist_or_list(token) and "whitespace" in str(token.ttype):
        return

    # check for join and union
    if isinstance(token, Token) and token.ttype != None and is_token_join_or_union(token) and is_token_keyword(token):
        # We got a join. Set the current_join
        if not check_in_join:
            check_in_join = True
            current_join = str(token)
        else:
            # this would mean 2 consecutive joins
            join_string = join_string.strip()
            # Check for a subquery
            if join_string == "(" or join_string == "":
                join_string = join_string + str(token) + "..."
            # add to list of join strings and reset the globals
            list_join_strings.append(current_join+":"+join_string)
            join_string = ""
            check_in_join = True
            current_join = str(token)
        return
    # If in join and did not get a keyword, add to join string
    elif check_in_join and not is_token_keyword(token) and not is_tokenlist_or_list(token):
        join_string += str(token)
    # check for a subquery after join
    elif check_in_join and (is_token_keyword(token) or is_token_word(token, 'sel')) and not is_tokenlist_or_list(token):
        check_in_join = False
        join_string = join_string.strip()
        if join_string == "(" or join_string == "":
            join_string = join_string + str(token) + "..."
        list_join_strings.append(current_join+":"+join_string)
        join_string = ""
        current_join = ""

    if is_tokenlist_or_list(token):
        for tok in token:
            get_join_strings(tok)

# Get the joins, cross joins and return the table names
def EvalFile(stmt):
    global cross_joins, list_join_strings, join_string
    cross_joins=0
    join_string = ""
    list_join_strings = []

    ls=get_join_recurse(stmt.tokens)
    check_cross_join_with_comma(stmt.tokens)
    for x in range(cross_joins):
        ls.append("CROSS JOIN")
    
    get_join_strings(stmt.tokens)

    return ls,list_join_strings
    
# Join processing
def get_join_lists(statements1, statements2):
    cols_list1,list_join_strings1 = EvalFile(statements1)
    cols_list2,list_join_strings2 = EvalFile(statements2)
    cols_list1.sort()
    cols_list2.sort()
    return cols_list1,cols_list2,list_join_strings1,list_join_strings2
