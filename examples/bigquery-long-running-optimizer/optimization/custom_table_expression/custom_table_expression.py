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
""" Module recommending to replace multiple CTEs with Temporary Tables """

from sqlparse.sql import IdentifierList, Parenthesis, Identifier
from utils_optimization.utils_optimization import get_line_numbers, update_count, is_token_join_or_from, is_tokenlist_or_list, is_token_CTE

# Global Variables
# 1. found_cte : Is a boolean value. Set to True if 'WITH' keyword is found.
# 2. identifiers_list : List of Identifiers.
# 3. dict1 : Dictionary with key set to cte name and value denoting the number of times the corresponding cte is used. 
# 4. found_keyword : Is a bollean value. Set to True, if JOIN or FROM is found.


# Go over the tokens and fetch the CTE's used
def get_identifier(identifiers_list):
    global list_of_ide, dict1
    for i in identifiers_list:
        list_of_ide = str(i).split()
        #adding the first encountered cte keyword to the dictionary with value 0
        dict1[list_of_ide[0]] = 0
    return


# Finds all the instances of the cte's and update its corresponding count in the dictionary
def find(token):
    global found_cte, identifiers_list, dict1, found_keyword
    if  isinstance(token, Identifier) or isinstance(token, Parenthesis):
            l = str(token).split()
            if len(l) == 1:
                # checks if the token is a cte
                if l[0] in dict1:
                    if found_keyword == True:
                        # update the count by 1 if cte is encountered
                        dict1[l[0]] = dict1[l[0]] + 1
                        found_keyword = False
            else:
                for key in dict1:
                    if key in l:
                            dict1 = update_count(key, l, dict1)
    elif isinstance(token, IdentifierList):
        for iden in token.get_identifiers():
            l = str(iden).split()
            for key in dict1:
                    if key in l:
                        #updating the count of the cte in dictionary
                            dict1 = update_count(key, l, dict1)
        

def get_cte_recurse(token):
    global found_cte, identifiers_list, dict1, found_keyword

    # Set found_keyword to TRUE if the token is either a JOIN or FROM
    if is_token_join_or_from(token):
        found_keyword = True
    
    # Return if the token is a whitespace
    if not is_tokenlist_or_list(token) and "Whitespace" in str(token.ttype):
        return
    

    # Set found_cte to TRUE if the token is WITH keyword
    if is_token_CTE(token):
        found_cte = True
        return

    # Check whether the token is either an Identifier or Parenthesis or Identifier list
    if (token.ttype is None):
            if isinstance(token, IdentifierList):
                if found_cte == True:
                    #looping through the identifier list
                    for identifier in token.get_identifiers():
                        identifiers_list.append(identifier)
                        get_identifier(identifiers_list)
                    
                    find(token)
                    # Setting found_cte to False once all the cte's entries are created in the dictionary
                    found_cte = False
                else:
                    find(token)
            elif isinstance(token, Identifier) or isinstance(token, Parenthesis):
                if found_cte == True:
                    identifiers_list.append(token)
                    get_identifier(identifiers_list)
                    find(token)
                    # Setting found_cte to False once all the cte's entries are created in the dictionary
                    found_cte = False
                else:
                    find(token)
            return

    # Check if token is of type Identifier or Identifier List
    if isinstance(token, Identifier) or isinstance(token, IdentifierList) and found_cte == False:
        find(token)


def get_cte(token):
     # Checks whether if the token is a tokenlist or of type of list
    if is_tokenlist_or_list(token):
        for tok in token:
            get_cte_recurse(tok)



def check_with_cte(stmt):
    global found_cte, identifiers_list, dict1, found_keyword
    identifiers_list =[]
    found_cte = False
    dict1 = {}
    found_keyword = False
    get_cte(stmt.tokens)
    return dict1

# Function to return recommendation for cte with line number and the number of times it is being used.
def consolidated_cte(statements_input, sql_statements):
    recommendation = []
    for i in statements_input:
        dict_res = check_with_cte(i)

         # Get line number where the cte is defined
        for cte, count in dict_res.items():
            if count >= 2:
                data = get_line_numbers(cte, count, sql_statements)
                recommendation.append(data)

    # return the recommendations
    return recommendation
    
    