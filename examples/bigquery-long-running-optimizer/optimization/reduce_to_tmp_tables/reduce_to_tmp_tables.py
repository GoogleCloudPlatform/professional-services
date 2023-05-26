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
""" Module for recommending converting large queries to Temporary Tables """

from sqlparse.sql import TokenList, Token

line_no=0 #global counter to keep a check on the current line number 
in_select=False #bool vars to check if we have started with select
in_union=False #bool vas to keep a check on union keyword
select_lin_no=-1 #last traversed line where select occured 
union_lin_no=-1 #last traversed line where union occured 
dic={} #Global dictionary where key-union line number, and value is a list of top most line number in the segment and the bottom most line number in the segment

#recursive function to find all the unions
def get_unions(token):
    global in_select, in_union, select_lin_no, dic, union_lin_no
    global line_no

    if isinstance(token, Token) and str(token) == "\n":
        line_no+=1
        return

    if in_union:
        if line_no-union_lin_no>3:
            dic[union_lin_no].append(line_no)
            in_union=False
            in_select=False
        return

    if in_select:
        
        if isinstance(token, Token) and (str(token).lower()).startswith("union"):
            in_union=True
            union_lin_no=line_no
            dic[union_lin_no]=[select_lin_no]
        
        elif isinstance(token, TokenList) or type(token) is list:
            current_union_state=in_union
            in_select=False
            in_union=False
            temp_lin_no=select_lin_no
            for tok in token:
                get_unions(tok)
            select_lin_no=temp_lin_no
            in_union=current_union_state
            in_select=True
            
        return
    
    if isinstance(token, Token) and str(token).lower() == "select":
        in_select=True
        if in_union==False:
            select_lin_no=line_no
    
    if isinstance(token, Token) and (str(token).lower() == ")" or str(token)==";") :
        # print("out select")
        in_select=False
        return
    
    # iterate over lists and tokenlists
    if isinstance(token, TokenList) or type(token) is list:
        for tok in token:
            get_unions(tok)

#function which calls the main utility
def reduce_to_temp(statements_input):
    global dic
    answer=[]
    for stmt in statements_input:
        get_unions(stmt)
    if len(dic)==0:
        return []
    for i in dic:
        dic_val=dic[i]
        top_loc=dic_val[0]
        union_loc=i
        bottom_loc=dic_val[1]
        recom=""
        if(union_loc-top_loc>3):
            recom+=f"query statement found above union present at line {union_loc+1} can be converted to a temp table, "
        if(bottom_loc-union_loc>3):
            recom+=f"query statement found below union present at line {union_loc+1} can be converted to a temp table, "
        if recom!="":
            answer.append(recom)
    return answer

