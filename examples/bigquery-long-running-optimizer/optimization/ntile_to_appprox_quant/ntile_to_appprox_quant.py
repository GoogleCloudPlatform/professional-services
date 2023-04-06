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
""" Module for recommending using APPROX_QUANTILES instead of NTILE """

from sqlparse.sql import TokenList, Token

lin_no=0 #global counter to keep a check on the current line number 
ntile_loc=[] #list to stole all the ntile locations(line numbers)

#recursive function to find out all the ntile in the query
def ntile(token):
    global lin_no,ntile_loc

    if isinstance(token, Token) and str(token)=="\n":
        lin_no+=1
        return

    if isinstance(token, TokenList) or type(token) is list:
        for tok in token:
            ntile(tok)
        return

    if isinstance(token, Token) and (str(token).lower()).startswith("ntile"):
        ntile_loc.append(lin_no)
        return
#funtion that calls the main utility    
def use_approx_quant(statements_input):
    global ntile_loc
    for stmt in statements_input:
        ntile(stmt)
    if(len(ntile_loc)==0):
        return []
    answer=[]
    for i in ntile_loc:
        recom = f"Found NTILE at line no. {i+1},  NTILE function can fail with a Resources exceeded error if there are too many elements to ORDER BY in a single partition. Consider using APPROX_QUANTILES instead"
        answer.append(recom)
    return answer

