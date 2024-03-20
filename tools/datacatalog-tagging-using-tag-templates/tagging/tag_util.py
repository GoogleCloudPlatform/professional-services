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


from google.cloud import datacatalog_v1
datacatalog = datacatalog_v1.DataCatalogClient()
from google.cloud import bigquery
import argparse
import re

import sys
import multiprocessing


client = datacatalog_v1.DataCatalogClient()

def parallelize(task, params):
   pool = multiprocessing.Pool(multiprocessing.cpu_count())
   results = pool.starmap(task, params)
   return results


def end_program_execution():
 print("Program execution finished.")
 sys.exit(1)


def search_entries(projects,search_string,level,mode,logs_enabled=False):
  
  
   level='table' if level == 'column' else level
   #datacatalog = datacatalog_v1.DataCatalogClient()
   scope = datacatalog_v1.types.SearchCatalogRequest.Scope()
   project_list=re.split(";|,",projects) if len(projects) > 1 else projects
   for project_id in project_list:
       scope.include_project_ids.append(project_id)
   search_string= search_string + " " + f"type={level}"
   search_results = client.search_catalog(scope=scope, query=search_string)
   pager=client.search_catalog(scope=scope, query=search_string)
   if logs_enabled == True:
       if not search_results.results:
           print("No results found for search query :  {0}".format(search_string))
       else:
           print("search results:")
           for result in pager:
               print(result.linked_resource.split("/",4)[-1])
              
   
  
   return search_results  




def tag_entries(dataplex_project_id, location_id, result, level, tag_template_id, tag_fields, tag_attributes, mode,search_string):
 """Looks up entries and tags in Dataplex using the provided search terms and tags.


 Args:
   project_id: The ID of the GCP project that contains the Dataplex lake.
   location_id: The ID of the GCP region where the Dataplex lake is located.
   search_terms: A list of search terms to use for the lookup.
   tags: A list of tags to use for the lookup.


 Returns:
   A list of dicts containing the results of the lookup. Each dict contains the
   following keys:
     - entry_name: The name of the entry.
     - tag_template_name: The name of the tag template.
     - tag_value: The value of the tag.
 """
 client = datacatalog_v1.DataCatalogClient() 


 created_tags={}
 entry=result.relative_resource_name
 linked_resource=result.linked_resource.split("/",3)[3]
 tag = datacatalog_v1.types.Tag()
 tag.template = client.tag_template_path(dataplex_project_id, location_id, tag_template_id)
 request = datacatalog_v1.GetTagTemplateRequest(name=tag.template)
 if level == 'column':
   tag.column=search_string.split('=')[1]
                  
 try:
   tag_template = client.get_tag_template(request)
 except Exception as exception:
   print(f"Exception Name: {type(exception).__name__} Exception Message: {exception}")
   return exception


 for field_id, field_value in tag_template.fields.items():
   created_tags.update({field_id : field_value.type_.primitive_type})


 result=client.list_tags(parent=entry)
 for response in result :
   if response.template == tag.template and response.column == tag.column :
       tag=response
       #tag_exists=True


 tags_list=tag_attributes.split(",")
 #if len(tag_attributes) > 1 else tag
 
 for tags in tags_list:
   field_id = tags.split("=")[0].strip().lower()
   field_value= tags.split("=")[1].strip()
   if field_id in created_tags.keys():  
       if created_tags[field_id] == datacatalog_v1.types.FieldType.PrimitiveType.PRIMITIVE_TYPE_UNSPECIFIED:
           tag.fields[field_id] = datacatalog_v1.types.TagField()
           tag.fields[field_id].enum_value.display_name = field_value                    
       elif created_tags[field_id] == datacatalog_v1.types.FieldType.PrimitiveType.STRING:
           tag.fields[field_id] = datacatalog_v1.types.TagField()
           tag.fields[field_id].string_value = field_value
       elif created_tags[field_id] == datacatalog_v1.types.FieldType.PrimitiveType.BOOL:
           tag.fields[field_id] = datacatalog_v1.types.TagField()
           if field_value.lower() == 'true':
               tag.fields[field_id].bool_value = 1
           else :
               tag.fields[field_id].bool_value = 0
       elif created_tags[field_id] == datacatalog_v1.types.FieldType.PrimitiveType.DOUBLE:
           tag.fields[field_id] = datacatalog_v1.types.TagField()
           tag.fields[field_id].double_value = field_value
       elif created_tags[field_id] == datacatalog_v1.types.FieldType.PrimitiveType.TIMESTAMP:
           tag.fields[field_id] = datacatalog_v1.types.TagField()
           tag.fields[field_id].timestamp_value = field_value
       elif created_tags[field_id] == datacatalog_v1.types.FieldType.PrimitiveType.RICHTEXT:
           tag.fields[field_id] = datacatalog_v1.types.TagField()
           tag.fields[field_id].richtext_value = field_value
      
 
  #update_mask = FieldMask(paths=["fields"])
 #print(update_mask)
 try:
   for response in result :
       if response.template == tag.template and response.column == tag.column :
           tag.name=response.name
           #request = datacatalog_v1.UpdateTagRequest(tag=tag , update_mask = update_mask)
           request = datacatalog_v1.UpdateTagRequest(tag=tag)
           tag = client.update_tag(request=request)
           print("Tag already exists, updating the tag")
           print("Updated tag : {} for {} {}".format(tag_template_id,level, linked_resource))
           break
   else:
       request = datacatalog_v1.CreateTagRequest(parent=entry, tag=tag)
       tag = client.create_tag(request=request)
       print("Created tag : {} for {} {}".format(tag_template_id, level, linked_resource))     


 except Exception as exception:
   print(f"Exception Name: {type(exception).__name__} Exception Message: {exception}")
   return exception




if __name__ == '__main__':
   #codeConfig = read_config_json()
   search_results=[]
   parser = argparse.ArgumentParser(description="Attachs tags to entities.")
   parser.add_argument('--search', dest='search_string', help='Search string to be used for searching assets', required=True)
   parser.add_argument('--table', dest='table_filter', help='specific table to which column to be tagged', required=False)
   parser.add_argument('--search_projects', dest='projects', help='Projects to be included in scope for search', required=True )
   parser.add_argument('--level', dest='level', help='Type of asset to be tagged', required=True, choices = {'dataset', 'view', 'table', 'column', 'materialized_view'} )
   parser.add_argument('--tag_template', dest='tag_template_id', help='Tag Template to be used for tagging', required=True )
   parser.add_argument('--tags', dest='tags', help='Tag attributes to be used for tagging', required=True)
   parser.add_argument('--tag_fields', dest='tag_fields', help='Tag fields to be used for tagging', required=True)
   parser.add_argument('--mode', dest='mode', default='historical',help='Mode', required=False)
   args = parser.parse_args()
   search_results=search_entries(args.projects,args.search_string, args.level, args.mode,logs_enabled=True)




   tasks=[]
   if args.table_filter != None:
       for search_result in search_results:
           tbl_str = search_result.linked_resource.split("/",4)[-1]
           tbl_name =  tbl_str[tbl_str.rfind('/') + 1:]
           if args.table_filter == tbl_name :
               tasks.append(("test-datahub", "us-central1", search_result, args.level, args.tag_template_id, args.tag_fields,args.tags, args.mode, args.search_string))
               break
   else :
       tbl = []
       if args.level == 'column':
               client1 = bigquery.Client()
               col = args.search_string.split('=')[1]
               query = f""" SELECT tablename FROM test-datahub.test1.Enterprise_Data_Catalog_Master where activeflag is true and tagflag is true and columnname='{col}' and tablename!=''
               """
              
               query_job = client1.query(query) 
               results = query_job.result()
               if results.total_rows != 0:
                   for res in results:
                       tbl.append(res["tablename"])
       for search_result in search_results:
           tbl_str = search_result.linked_resource.split("/",4)[-1]
           tbl_name =  tbl_str[tbl_str.rfind('/') + 1:]
           if tbl_name not in tbl:
               tasks.append(("test-datahub", "us-central1", search_result, args.level, args.tag_template_id, args.tag_fields,args.tags, args.mode, args.search_string))
      
   parallelize(tag_entries,tasks)
  




