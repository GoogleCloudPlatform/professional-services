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
""" Module with reusable code for other modules """

import re
from sqlparse.sql import TokenList, Token

def remove_multiple_whitespaces(content):
    ct = re.sub('\t', ' ', content)
    ct = re.sub(' +', ' ', ct)
    ct = re.sub(' \. ', '.', ct)
    return ct

def retrieve_view_create_statement(statements):
    stmt = ""
    for st in statements:
        if ("create view" in str(st).lower()) or ("replace view" in str(st).lower()) or ("replace recursive view" in str(st).lower()):
            stmt = st
            break
    return stmt

def format_dict_to_output_string(dict1, dict2):
    op = "["
    for key in dict1:
        op = op + str(key) + " : " + str(dict1[key]) + ", "
    op = op + " ; "
    for key in dict2:
        op = op + str(key) + " : " + str(dict2[key]) + ", "
    op = op[:len(op)-1]
    op = op + "]"
    return op

def generate_count_and_name_output_string(validation_type, list1, list2, status_count, status_name):
    if validation_type == "column" or validation_type == "object":
        return "Count Validation: " + str(status_count)+ " ( " +(str(len(list1))+" | "+str(len(list2))) + " ) " + "Name Validation: " + str(status_name)
    elif validation_type == "join" or validation_type == "function" or validation_type=='statement':
        return "Count Validation: " + str(status_count) + " ( " + (str(len(list1))+" | "+str(len(list2))) + " ) ; "
    elif validation_type == "isnull":
        return "Count Validation: " + str(status_count)

def log_list_to_string(list):
    log_string=""
    index=1
    for element in list:
        log_string += f"\t\t\t\t\t\t\t {index}. {element} \n"
        index+=1
    return log_string

def is_token_keyword(token):
    return isinstance(token, Token) and "keyword" in str(token.ttype).lower()

def is_token_join_or_union(token):
    return isinstance(token, Token) and ('join' in str(token).lower() or 'union' in str(token).lower())

def is_token_outer_join(token):
    return isinstance(token, Token) and "outer join" in str(token).lower()

def is_token_inner_join(token):
    return isinstance(token, Token) and "inner join" in str(token).lower()

def is_tokenlist_or_list(token):
    return isinstance(token, TokenList) or type(token) is list

def is_token_word(token, word):
    return isinstance(token, Token) and str(token).lower() == word.lower()

def formatNewLines(q): return " ".join([s.strip() for s in q.splitlines()])