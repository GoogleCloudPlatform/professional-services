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
""" Module recommending to use GROUP BY instead of DISTINCT """

from sqlparse.sql import IdentifierList, Identifier, TokenList, Token

#function to store all the locations(line numbers where ditinct occurs)
def get_distinct_loc(sql):
    global distinct_loc 
    distinct_loc=[]
    for i,lin in enumerate(str(sql).split("\n")):
        for ind,j in enumerate(lin.split(" ")):
            if j.lower() == "distinct":
                if(ind!=0):
                    if("select" in lin.split(" ")[ind-1].lower()):
                        distinct_loc.append(i)
                if(ind==0):
                    exlin=str(sql).split("\n")[i-1]
                    if("select" in exlin.split(" ")[-1].lower()):
                        distinct_loc.append(i)

col_list=[]#list of all the columns occuring after distinct
list_col_list=[]#list of column list
distinct_loc=[]#list of distinct locations
in_distinct=False#bool var to check if distinct keyword has been encountered
in_select=False#bool var to check if distinct keyword has been encountered

#function to store all the columns post distinct
def get_col_list(token):
    global in_distinct,in_select
    global col_list
    global list_col_list
    if str(token)==" " or str(token)=="\n":
        return
    if in_distinct:
        if "Wildcard" in str(token.ttype):
            return
        if isinstance(token, Token) and isinstance(token, IdentifierList):
            for item in token.get_identifiers():
                col_list.append(item)
            return
        elif isinstance(token, Token) and isinstance(token, Identifier):
            col_list.append(token)
            return

    if isinstance(token, Token) and str(token).lower() == "select":
        in_select=True
        return

    if isinstance(token, Token) and str(token).lower() == "distinct" and in_select:
        in_distinct=True
        in_select=False
        return

    in_select=False

    if isinstance(token, Token) and str(token).lower() == "from":
        in_distinct=False
        if(len(col_list)>0):
            list_col_list.append(col_list)
            col_list=[]
    
    # iterate over lists and tokenlists
    if isinstance(token, TokenList) or type(token) is list:
        for tok in token:
            get_col_list(tok)


#function that calls the main utility
def distinct_optimise(statements_input, sql):
    global list_col_list
    global distinct_loc 
    answer=[]
    number=0
    get_distinct_loc(sql)
    if(len(distinct_loc)==0):
        return []

    for stmt in statements_input:
        list_col_list=[]
        get_col_list(stmt.tokens)
        if(len(list_col_list)!=len(distinct_loc)):
            return []

        for lines in list_col_list:
            recom="GROUP BY "
            for i in lines:
                recom+=i.get_name()+", "
            if number < len(distinct_loc):
                answer.append((distinct_loc[number]+1,recom))
                number+=1
    return answer
    