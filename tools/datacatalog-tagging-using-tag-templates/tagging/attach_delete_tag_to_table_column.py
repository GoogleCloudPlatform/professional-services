"""
Copyright 2023 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

"""



import re
from google.cloud import datacatalog_v1

import subprocess
import google.cloud.bigquery as bigquery
import tag_util
from collections import defaultdict
import sys


"""
Use:
   Class used for creating tags for each record
Variables:
"""
class column_tags:
 def __init__(self,id,column,table,projectname,datasetname,tag_template,tag_fields,tag):
   self.id = id
   self.column= column
   self.table= table
   self.projectname = projectname
   self.datasetname = datasetname
   self.tag_template = tag_template
   self.tag_fields = tag_fields
   self.tag = tag


class table_tags:
 def __init__(self,id,table,projectname,datasetname,tag_template,tag_fields,tag):
   self.id = id
   self.table= table
   self.projectname = projectname
   self.datasetname = datasetname
   self.tag_template = tag_template
   self.tag_fields = tag_fields
   self.tag = tag


def delete_tag(config_table):
   # Opening  table
   try:
       catalogclient = datacatalog_v1.DataCatalogClient()
       client = bigquery.Client()
       job_config = bigquery.QueryJobConfig(use_query_cache=False)
      
      
       query = f"""
               SELECT id,projectname,datasetname,tablename,columnname,tagtemplate,level,tag
               FROM {config_table} where upper(mode)="DELETE"
               """
      
       results = client.query(query,job_config=job_config).result()


       if results.total_rows == 0:
           print("No tags to delete")
       else :
           for row in results:
               id = row['id']
               if row['level']=='table':
                   search_results=tag_util.search_entries(row['projectname'],row['projectname']+'.'+row['datasetname']+'.'+row['tablename'], row['level'], '',logs_enabled=True)
               else :
                   search_results=tag_util.search_entries(row['projectname'],row['columnname'], row['level'], '',logs_enabled=True)
                   lst_tables = []
                   colname = row['columnname']
                   tbl_name = row['tablename']
                   if row['level']=='column' and row['tablename'] == '' :
                       print(f"Deleting tags for this column = {colname} in all the tables except : ")
                       colquery = f"""
                               SELECT tablename
                               FROM {config_table} where columnname = '{colname}' and tablename != ''
                               """
                       col_results = client.query(colquery,job_config=job_config).result()
                       if col_results.total_rows != 0:
                           for r in col_results:
                               lst_tables.append(r['tablename'])
                           print(lst_tables)
                   else :
                       print(f"Deleting tags for this column = {colname} in only in this specific table : {tbl_name} ")




               
               for search_result in search_results:
                   entry=search_result.relative_resource_name
                   result=catalogclient.list_tags(parent=entry)
                   for response in result :
                       tbl_str = search_result.linked_resource.split("/",4)[-1]
                       tbl_name =  tbl_str[tbl_str.rfind('/') + 1:]
                       if row['level']=='table':
                           if response.template.split("/")[-1] == row['tagtemplate'] and response.column == '':
                               catalogclient.delete_tag(name=response.name)
                               print(f"Tag deleted successfully for table : {tbl_name}")
                       elif row['level']=='column' and row['tablename'] != '':
                           if response.template.split("/")[-1] == row['tagtemplate'] and response.column == row['columnname']:
                               if row['tablename'] == tbl_name :
                                   catalogclient.delete_tag(name=response.name)
                                   print("Tag deleted successfully for table " + tbl_name + " for column : " + str(response.column))
                       elif row['level']=='column' and row['tablename'] == '':
                           if response.template.split("/")[-1] == row['tagtemplate'] and response.column == row['columnname']:
                               if tbl_name not in lst_tables:
                                   catalogclient.delete_tag(name=response.name)
                                   print("Tag deleted successfully for table " + tbl_name + " for column : " + str(response.column))


               update_query = """UPDATE `test-datahub.test1.Enterprise_Data_Catalog_Master` set tagflag=false,activeflag=false,mode='DELETED' WHERE id = '{0}'
                               AND activeflag is true and mode='DELETE'""".format(id)
               query_job = client.query(update_query) 
               query_job.result()


 
   except Exception as exception:
       print(f"Exception Name: {type(exception).__name__} Exception Message: {exception}")
      






def attach_config(config_table):
   allColumnTaggingList = []
   tableTaggingList = []
   specificColumnTaggingList = []
   # Opening  table
   try:
       client = bigquery.Client()
       job_config = bigquery.QueryJobConfig(use_query_cache=False)
      
      
       query = f"""
               SELECT id,projectname,datasetname,tablename,columnname,tagtemplate,level,tag
               FROM {config_table} where activeflag is true and tagflag is false
               """
      
       results = client.query(query,job_config=job_config).result()


       if results.total_rows == 0:
           print("Query gave no results , nothing to tag")
       for row in results:
           if row["level"] == "column" and row["tablename"] == '':
               tag_str=''
               tag_fields = ''
               for record in row["tag"]:
                   tag_str += ","+record['key']+"="+record['value']
                   tag_fields += ","+record['key']
               allColumnTaggingList.append(column_tags(row["id"],row["columnname"],'',row["projectname"],row["datasetname"],row["tagtemplate"],tag_fields[1:],tag_str[1:]))
           if row["level"] == "column" and row["tablename"] != '':
               tag_str=''
               tag_fields = ''
               for record in row["tag"]:
                   tag_str += ","+record['key']+"="+record['value']
                   tag_fields += ","+record['key']
               specificColumnTaggingList.append(column_tags(row["id"],row["columnname"],row["tablename"],row["projectname"],row["datasetname"],row["tagtemplate"],tag_fields[1:],tag_str[1:]))
           elif row["level"] == "table" :
               tag_str=''
               tag_fields = ''
               for record in row["tag"]:
                   tag_str += ","+record['key']+"="+record['value']
                   tag_fields += ","+record['key']
               tableTaggingList.append(table_tags(row["id"],row["tablename"],row["projectname"],row["datasetname"],row["tagtemplate"],tag_fields[1:],tag_str[1:]))
           
   except Exception as exception:
       print(f"Exception Name: {type(exception).__name__} Exception Message: {exception}")
  
   return specificColumnTaggingList,allColumnTaggingList , tableTaggingList


"""
Use:
   Iterates the Tagging List and  attach a tag to each BigQuery column.
Args:
   project_id: The Google Cloud project id to use
   location: The Google Cloud region in which to create the Tag Template
   taggingList : List of objects for each record and associated tags
Returns:
   None; the response from the API is printed to the terminal.
"""
def attach_column_tags_to_all(taggingList):
 client = bigquery.Client()
 tagged_resources = defaultdict(list)
 


 for record in taggingList:
   column = record.column
   id = record.id
   template_name = record.tag_template
   if column not in tagged_resources:
       # Steps to tag column
       search=f'column={column}'
       level='column'
       search_projects = record.projectname
       tags=record.tag
       print("Tagging for input " + column + " for level " + level)
       stdout, stderr=execute_tagger(search,level,search_projects,template_name,record.tag_fields,tags)
       if len(stderr.decode("utf-8")) != 0:
           print(stderr.decode("utf-8"))
           column_dict={'view_id': '','message' : stderr.decode("utf-8").split(": ERROR :")[-1], 'tagged' : False}
           {tagged_resources[column].append(column_dict)}
       else :
           print(stdout.decode("utf-8"))
           matches = re.findall(r"projects.*.datasets.*.tables.*",stdout.decode("utf-8"))
           for view in matches:
               column_dict={'view_id': view,'message' : stdout.decode("utf-8").split(": INFO :")[-1], 'tagged' : True}
               {tagged_resources[column].append(column_dict)}
           update_query = """UPDATE `test-datahub.test1.Enterprise_Data_Catalog_Master` set tagflag=true WHERE id = '{0}' AND activeflag is true""".format(id)
           #print(update_query)
           query_job = client.query(update_query) 
           query_job.result()
       
 return tagged_resources


def attach_table_tags(taggingList):
   client = bigquery.Client()
   tagged_resources = defaultdict(list)


   for record in taggingList:
       id = record.id
       table = record.projectname + '.' + record.datasetname + '.' + record.table
       template_name = record.tag_template
       #search_results=tagger.search_entries(search_projects,search,level,mode)
       if table not in tagged_resources:
       # Steps to tag table
           search=f'{table}'
           level='table'
           search_projects = record.projectname
           tags=record.tag
           print("Tagging for input " + table + " for level " + level)
           #search_results=tagger.search_entries(search_projects,search,level,mode)
           stdout, stderr=execute_tagger(search,level,search_projects,template_name,record.tag_fields,tags)
           if len(stderr.decode("utf-8")) != 0:
               print(stderr.decode("utf-8"))
               column_dict={'view_id': '','message' : stderr.decode("utf-8").split(": ERROR :")[-1], 'tagged' : False}
               {tagged_resources[table].append(column_dict)}
           else :
               print(stdout.decode("utf-8"))
               matches = re.findall(r"projects.*.datasets.*.tables.*",stdout.decode("utf-8"))
               for view in matches:
                   column_dict={'view_id': view,'message' : stdout.decode("utf-8").split(": INFO :")[-1], 'tagged' : True}
                   {tagged_resources[table].append(column_dict)}
               update_query = """UPDATE `test-datahub.test1.Enterprise_Data_Catalog_Master` set tagflag=true WHERE id = '{0}'
                               AND activeflag is true""".format(id)
               query_job = client.query(update_query) 
               query_job.result()


   return tagged_resources


def attach_column_tags_to_specific(taggingList):
 client = bigquery.Client()
 tagged_resources = defaultdict(list)
 


 for record in taggingList:
   id = record.id
   column = record.column
   table = record.table
   template_name = record.tag_template
   if column not in tagged_resources:
       # Steps to tag column
       search=f'column={column}'
       level='column'
       search_projects = record.projectname
       tags=record.tag
       print("Tagging for input " + column + " for level " + level + " for table " + table)
       stdout, stderr=execute_tagger_specific(search,table,level,search_projects,template_name,record.tag_fields,tags)
       if len(stderr.decode("utf-8")) != 0:
           print(stderr.decode("utf-8"))
           column_dict={'view_id': '','message' : stderr.decode("utf-8").split(": ERROR :")[-1], 'tagged' : False}
           {tagged_resources[column].append(column_dict)}
       else :
           print(stdout.decode("utf-8"))
           matches = re.findall(r"projects.*.datasets.*.tables.*",stdout.decode("utf-8"))
           for view in matches:
               column_dict={'view_id': view,'message' : stdout.decode("utf-8").split(": INFO :")[-1], 'tagged' : True}
               {tagged_resources[column].append(column_dict)}
           update_query = """UPDATE `test-datahub.test1.Enterprise_Data_Catalog_Master` set tagflag=true WHERE id = '{0}' AND activeflag is true""".format(id)
           query_job = client.query(update_query) 
           query_job.result()
       
 return tagged_resources




def execute_tagger(search,level,search_projects,tag_template,tag_fields,tags):
   try:
       command = [
           "python3",
           "tag_util.py",
           "--search={}".format(search),
           "--level={}".format(level),
           "--search_projects={}".format(search_projects),
           "--tag_template={}".format(tag_template),
           "--tag_fields={}".format(tag_fields),
           "--tags={}".format(tags)
       ]
       process = subprocess.Popen(command,stdout=subprocess.PIPE, stderr=subprocess.PIPE)
       exit_code = process.wait()
       if exit_code != 0:
           raise Exception("Failed to call tagger script.")
       return process.communicate()
   except Exception as exception:
       print(exception)
       stdout,stderr=process.communicate()
       print(stderr.decode("utf-8"))
       sys.exit(1)


def execute_tagger_specific(search,table,level,search_projects,tag_template,tag_fields,tags):
   try:
       command = [
           "python3",
           "tag_util.py",
           "--search={}".format(search),
           "--table={}".format(table),
           "--level={}".format(level),
           "--search_projects={}".format(search_projects),
           "--tag_template={}".format(tag_template),
           "--tag_fields={}".format(tag_fields),
           "--tags={}".format(tags)
       ]
       process = subprocess.Popen(command,stdout=subprocess.PIPE, stderr=subprocess.PIPE)
       exit_code = process.wait()
       if exit_code != 0:
           raise Exception("Failed to call tagger script.")
       return process.communicate()
   except Exception as exception:
       print(exception)
       stdout,stderr=process.communicate()
       print(stderr.decode("utf-8"))
       sys.exit(1)


  
  
      
if __name__ == '__main__':
  
  
   specificColumnTaggingList,allColumnTaggingList , tableTaggingList = attach_config("test-datahub.test1.Enterprise_Data_Catalog_Master")
   all_column_tagged_resources = attach_column_tags_to_all(allColumnTaggingList)
   table_tagged_resources = attach_table_tags(tableTaggingList)
   specific_column_tagged_resources = attach_column_tags_to_specific(specificColumnTaggingList)
   delete_tag("test-datahub.test1.Enterprise_Data_Catalog_Master")
   print("done")
  

