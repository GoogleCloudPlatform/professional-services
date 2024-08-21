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
from google.cloud import bigquery
from google.cloud.exceptions import NotFound


def formatNewLines(q): 
        return " ".join([s.strip() for s in q.splitlines()])

def remove_multiple_whitespaces(content):
        ct = re.sub('\t', ' ', content)
        ct = re.sub(' +', ' ', ct)
        ct = re.sub(' \. ', '.', ct)
        return ct

def is_tokenlist_or_list(token):
    return isinstance(token, TokenList) or type(token) is list

def is_token_CTE(token):
    return isinstance(token, Token) and "keyword" in str(token.ttype).lower() and "CTE" in str(token.ttype)

def is_token_keyword(token):
    return isinstance(token, Token) and "keyword" in str(token.ttype).lower()

def is_token_join_or_from(token):
    return isinstance(token, Token) and ('join' in str(token).lower() or 'from' in str(token).lower())

def is_token_word(token, word):
    return isinstance(token, Token) and str(token).lower() == word.lower()

def is_token_cross_join(token):
    return isinstance(token, Token) and "cross join" in str(token).lower()

def check_from(token):
    return isinstance(token, Token) and 'Keyword' in str(token.ttype) and 'FROM' in str(token).upper()

def check_join(token):
    return isinstance(token, Token) and 'JOIN' in str(token).upper() and 'Keyword' in str(token.ttype)

def is_select(token):
    return isinstance(token, Token) and 'SELECT' in str(token).upper() and 'DML' in str(token.ttype)

def update_count(cte_key, list_of_tokens, dict1):
    case_1 = cte_key+")"
    case_2 = cte_key
    indices  = [index for (index, ele) in enumerate(list_of_tokens) if ele == case_1]
    indices_1  = [index for (index, ele) in enumerate(list_of_tokens) if ele == case_2]
    indices_1 = indices_1 + indices 
 
    for idx_1 in indices_1:
        if idx_1>0 and idx_1 < len(list_of_tokens):
            if list_of_tokens[idx_1 - 1] in ['FROM', 'JOIN', 'from', 'join']:
                dict1[cte_key] = dict1[cte_key]+ 1
    return dict1

def get_line_numbers(cte, count, sql_statements):
    #list_of_line_numbers = []
    line_number = 0
    for chunks in sql_statements.split('\n'):
        line_number = line_number + 1
        if cte in chunks.split():
            description = "CTE {0} defined at line number {1} is used {2} times, consider replacing all the instances of CTE with a temporary table.".format(cte, line_number, count)
            return description

def get_line_numbers_for_select(sql_input, res_list, fname):
    line_number = 0
    description = []
    count = 0
    found_select = False
    for chunks in sql_input.split('\n'):
                chunks_ = chunks.split()
                line_number = line_number + 1
                for idx, ele in enumerate(chunks_):
                    if ele.upper() == 'SELECT':
                        found_select = True
                    elif ele.upper() == 'FROM':
                        found_select = False
                    elif found_select == True:
                        if ele == '*' and idx-1 >= 0:
                            pre_ele = chunks_[idx-1]
                            l = [e for i, e in enumerate(pre_ele) if i == len(pre_ele)-1]
                            print("l is --", l[0])
                            if l[0]==',':
                                print("entered pattern * without ,")
                                chunks_[idx] = chunks_[idx] + 'checked'
                                description.append("Instead of \"{0}\" Consider selecting required columns at line number {1}".format(res_list[count], line_number))
                                count = count + 1  
                            elif pre_ele.upper() == 'SELECT':
                                print("entered pattern * without ,")
                                chunks_[idx] = chunks_[idx] + 'checked'
                                description.append("Instead of \"{0}\" Consider selecting required columns at line number {1}".format(res_list[count], line_number))
                                count = count + 1
                        elif ele == '*' or ele == '*,':
                            print("entered pattern *")
                            chunks_[idx] = chunks_[idx] + 'checked'
                            description.append("Instead of \"{0}\" Consider selecting required columns at line number {1}".format(res_list[count], line_number))
                            count = count + 1  
                        else:
                            pattern = '^[a-zA-Z0-9_]+\.\*[,]?'
                            res = re.match(pattern, ele)
                            if res:
                                chunks_[idx] = chunks_[idx] + 'checked'
                                description.append("Instead of \"{0}\" Consider selecting required columns at line number {1}".format(res_list[count], line_number))
                                count = count + 1
    return description
    

def create_external_table(bq_ds_id, bq_tbl_name):
    

    dataset_id = bq_ds_id
    table_id = bq_tbl_name

    client = bigquery.Client()
    schema = [
                bigquery.SchemaField("Batch_ID", "STRING", mode="REQUIRED"),
                bigquery.SchemaField("FileName", "STRING", mode="REQUIRED"),
                bigquery.SchemaField("Best_Practice", "STRING", mode="REQUIRED"),
                bigquery.SchemaField("Recommendation", "String", mode="REQUIRED")
            ]
    dataset_ref= client.dataset(dataset_id)

    try:
        dataset = client.get_dataset(dataset_ref)
        print('Dataset {} already exists.'.format(dataset))
    except NotFound:
        dataset = bigquery.Dataset(dataset_ref)
        dataset.location = "US"
        dataset = client.create_dataset(dataset)

    dataset_ref = client.dataset(dataset_id)
    table_ref = dataset_ref.table(table_id)

    try:
            table = client.get_table(table_ref)
            print('table {} already exists.'.format(table))
    except NotFound:
            schema = schema
            table = bigquery.Table(table_ref, schema=schema)
            external_config = bigquery.ExternalConfig('CSV')
            external_config.csv_options.skip_leading_rows = 1
            uri_for_cte = f'gs://bq_long_running_optimization/output_cte/*.csv'
            uri_1 = f'gs://bq_long_running_optimization/output/*.csv'
            source_uris = [uri_for_cte, uri_1]
            external_config.source_uris = source_uris
            table.external_data_configuration = external_config
            table = client.create_table(table)  # Make an API request.
            print("Created table {}".format(table.table_id))


                        