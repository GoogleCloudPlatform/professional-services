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
""" Module for recommending filtering before join """

import re
from sqlparse.sql import TokenList, Token, Parenthesis, Function

# Global Variables
# 1. subquery_list : List of all subqueries in the SQL
# 2. query_structure : Order wise list of  select, and, on, where and join keywords.
# 3. first_parenthesis : records for first parenthesis for the first query.
# 4. current_and_string : record the string between AND and next keyword.
# 5. inside_and : check if token is in AND and a keyword
# 6. detailed_and_statements : Get the whole clause for filter statements
# 7. current_detailed_and_string : whole clause string for and_statement
# 8. lineNumber : records line number of the token
# 9. subquery_line_map : line number for start of subquery
# 10. subquery_length_map : length of the given subquery
# 11. first_query : records for first query
# 12. pLine : length of the Parenthesis statement.

subquery_list = []
query_structure = []
first_parenthesis = False
current_and_string = ""

inside_and = False
and_statements = []
detailed_and_statements = []
current_detailed_and_string = ""

lineNumber = 1
subquery_line_map = []
subquery_length_map = []

first_query = True

pLine = 0

# Function to conditionally add the recommendation logic
def populate_recommendation(parts, recommendation_logic):
    if len(parts) > 2:
        recommendation_logic.append("Please Filter Data Before Join on Line Number "+ parts[1]+ ", where the Filter "+parts[0]+ " with clause :: "+ parts[3] + " should come before join.")
    elif len(parts) == 2:
        recommendation_logic.append("Please Filter Data Before Join on Line Number "+ parts[1]+ ", where the Filter "+parts[0]+ " should come before join.")
    else:
        print("error encountered", parts)
        
# Function to get the length of the parenthesis ie. subquery/function.
def get_parenthesis_length(token):
    global pLine
    if str(token) == "\n":
        pLine = pLine + 1
    if isinstance(token, TokenList) or type(token) is list:
        for tok in token:
            get_parenthesis_length(tok)
    
    
# Function to identify the subqueries and get the subquery tokens in an array.
def understand_subquery(token):
    global lineNumber, subquery_line_map, subquery_length_map, pLine

    # Keep record of lineNumber
    if str(token) == "\n":
        lineNumber = lineNumber + 1

    # If function, we dont append. Get length of function and append to lineNumber
    if isinstance(token, Function):
        pLine = 0
        get_parenthesis_length(token)
        lineNumber = lineNumber + pLine
        return
    
    # If parenthesis, subquery added to list with line and length.
    if isinstance(token, Parenthesis):
        pLine = 0
        get_parenthesis_length(token)
        subquery_list.append(token)
        subquery_line_map.append(lineNumber)
        subquery_length_map.append(pLine)

    if isinstance(token, TokenList) or type(token) is list:
        for tok in token:
            understand_subquery(tok)

# Function to get the query structure with select, and, on , where and join keywords.
def find_query_structure(token, index):
    global current_detailed_and_string, detailed_and_statements, query_structure, first_parenthesis, inside_and, and_statements, current_and_string, lineNumber, query_structure, subquery_line_map, first_query, subquery_length_map, pLine

    # We need to detect line numbers for keywords too.
    if str(token) == "\n":
        lineNumber = lineNumber + 1
    
    # Handle lineNumber for Function
    if isinstance(token, Function):
        pLine = 0
        get_parenthesis_length(token)
        lineNumber = lineNumber + pLine

        if inside_and:
            current_detailed_and_string += str(token)
        return
    
    # If parenthesis, increase lineNumber.
    if isinstance(token, Parenthesis):
        # Remember, the first query wont have parenthesis as start. So, any parenthesis encountered is subquery
        if first_query:
            lineNumber = lineNumber +  subquery_length_map[subquery_list.index(token)]
            return
        
        # If not first_query, subquery will have parenthesis as start. So, we have to ignore it initially
        if not first_parenthesis:
            first_parenthesis = True
        else :
            lineNumber = lineNumber +  subquery_length_map[subquery_list.index(token)]
            return
    
    # If we encounter a keyword, break the current_and_string and append to and_statements.
    if not (isinstance(token, TokenList) or type(token) is list) and "keyword" in str(token.ttype).lower(): 
        if inside_and:
            inside_and = False
            and_statements.append(current_and_string)
            detailed_and_statements.append(current_detailed_and_string)
            current_and_string = ""
            current_detailed_and_string = ""
    
    # If we are inside and before other keyword, add this to current_and_string.
    if inside_and :
        if not isinstance(token, TokenList) and not str(token).isspace():
            current_and_string += str(token)
            current_detailed_and_string += str(token)
    
    # Handle cases for select, joins, where, ands and ons
    if isinstance(token, Token) and str(token).lower() == "select":
        query_structure[index].append(str(token).lower()+"::::"+str(lineNumber))
    if isinstance(token, Token) and ('join' in str(token).lower() or 'union' in str(token).lower()) and ("keyword" in str(token.ttype).lower()):
        query_structure[index].append(str(token).lower()+"::::"+str(lineNumber))
    if isinstance(token, Token) and str(token).lower() == "where":
        query_structure[index].append(str(token).lower()+"::::"+str(lineNumber))
    
    # if and or on, put inside_and as True
    if isinstance(token, Token) and (str(token).lower() == "and" or str(token).lower() == "on"):
        if not inside_and :
            inside_and = True
        query_structure[index].append(str(token).lower()+"::::"+str(lineNumber))

    if isinstance(token, TokenList) or type(token) is list:
        for tok in token:
              find_query_structure(tok, index)

# Function to provide the recommendation for filter data before join recursively
def filter_data_before_join(statement):
    global detailed_and_statements, current_detailed_and_string, subquery_list, first_parenthesis, query_structure, and_statements, inside_and, current_and_string, lineNumber, subquery_line_map, first_query, subquery_length_map
    # Global variables to get subquery list, start of subquery and length of subqueries
    first_query = True
    subquery_list = []
    subquery_line_map = []
    subquery_length_map = []

    # Append values for the main query
    subquery_list.append(statement.tokens)
    subquery_line_map.append(1)
    subquery_length_map.append(0)
    query_structure = []

    # Populate subquery values. 
    understand_subquery(statement.tokens)

    # Now, go over each subquery independently
    for x in range(len(subquery_list)):
        first_parenthesis = False
        inside_and = False
        and_statements = []
        detailed_and_statements = []
        current_and_string = ""
        current_detailed_and_string = ""

        # query structure initialization. It is array of array.
        query_structure.append([])

        # Get the lineNumber for the current subquery being processed.
        lineNumber = subquery_line_map[x]

        # This returns the structure of subquery with relative posn of select, on, and, join and where.
        find_query_structure(subquery_list[x], x)

        if first_query:
            first_query = False
        
        # current_and_string is not empty, it has clauses which were not recognized due to no keyword.
        if current_and_string != "":
            if current_and_string[-1] == ')':
              and_statements.append(current_and_string[:-1])
            else:
                and_statements.append(current_and_string)
        
        if current_detailed_and_string != "":
            if current_detailed_and_string[-1] == ')':
              detailed_and_statements.append(current_detailed_and_string[:-1])
            else:
                detailed_and_statements.append(current_detailed_and_string)

        # For all the recorded and_statements, get the second half after equalizer
        # Check if there needs to be a filter or not.
        for ele in and_statements:
            after_operator_string = re.split('[=><]', ele)[-1]
            if ("\'" or "\"") in after_operator_string:
              and_statements[and_statements.index(ele)] += "--filter"
            else:
                if "." in after_operator_string:
                    if after_operator_string.replace('.','',1).isdigit() and after_operator_string.count('.') < 2:
                      and_statements[and_statements.index(ele)] += "--filter"
                else:
                    if after_operator_string.isdigit() :
                        and_statements[and_statements.index(ele)] += "--filter"

        # Check if there is --filter in and_statements and map the --filter to query_structure keywords.
        if len(and_statements) > 0:
          x = 0
          for i in range(len(query_structure[-1])):
              if ("and" in query_structure[-1][i] or "on" == (query_structure[-1][i].split("::::"))[0]):
                  if "--filter" in and_statements[x]:
                      query_structure[-1][i] += "::::"+and_statements[x] + "::::" + detailed_and_statements[x]
                  x+=1
    
    # Build the recommendation logic.
    recommendation_logic = []

    for x in query_structure:
      got_join = -1
      for ele in x:
          parts = ele.split("::::")
          if "join" in parts[0]:
              got_join = 0
          if "on" in parts[0]:
              got_join = 1
              if "--filter" in ele:
                  populate_recommendation(parts, recommendation_logic)
        
          if "and" in parts[0]:
              if "--filter" in ele:
                if got_join == 1:
                    populate_recommendation(parts, recommendation_logic)
          if "where" in parts[0]:
              if got_join == 1:
                populate_recommendation(parts, recommendation_logic)
              
    return recommendation_logic

# Function called by main_dag.py to parse the SQL query 
def all_filter_before_join(parsedStatements):
    global lineNumber
    lineNumber = 1
    res = []
    for ele in parsedStatements:
        arr = filter_data_before_join(ele)
        res = res + arr
    
    return res
