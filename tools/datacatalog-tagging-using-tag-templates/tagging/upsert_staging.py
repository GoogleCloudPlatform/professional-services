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

from google.cloud import bigquery


# Construct a BigQuery client object.
client = bigquery.Client()


# Soft delete sql
query1 = """
       update `test-datahub.test1.Enterprise_Data_Catalog_Master` set mode='DELETE' , UpdateTimestamp = current_timestamp()
       where id in (
       SELECT  a.id
       FROM (select * from `test-datahub.test1.Enterprise_Data_Catalog_Master` where activeFlag is true ) a
       LEFT JOIN `test-datahub.test1.Enterprise_Data_Catalog_Master_Landing` b
          ON a.id = b.id WHERE b.id IS NULL
       and a.activeflag = TRUE) and activeflag = TRUE
       """
query_job = client.query(query1) 
results = query_job.result()




# SCD2 - merge
query2 = """
       MERGE `test-datahub.test1.Enterprise_Data_Catalog_Master` target
       USING
       (
       select
       l.id AS id,
       ARRAY_AGG(STRUCT(l.tag_key,l.tag_value)) AS tag
       from
       (
       select
       p.id,
       b.key as tag_key,
       b.value as tag_value,
       from
       `test-datahub.test1.Enterprise_Data_Catalog_Master` p,
       unnest(tag)b
       where activeFlag is true
       ) L
       join
       (select
       p.id,
       b.key as tag_key,
       b.value as tag_value,
       from
       `test-datahub.test1.Enterprise_Data_Catalog_Master_Landing` p,
       unnest(tag)b
       ) R on l.id = R.id and l.tag_key = R.tag_key and  l.tag_value <> R.tag_value
       GROUP BY l.id
       ) source ON target.id = source.id and target.activeflag is true
       WHEN MATCHED THEN UPDATE
       SET
       target.activeflag = false ,
       target.mode = 'HISTORICAL',
       target.UpdateTimestamp = current_timestamp()
       """
query_job = client.query(query2) 
results = query_job.result()


# Insert sql
query3 = """
       INSERT INTO `test-datahub.test1.Enterprise_Data_Catalog_Master` (projectname,datasetname,tablename,columnname,level,tagtemplate,tag,id,createtimestamp,tagflag,activeflag,mode)
       select source.projectname,source.datasetname,source.tablename,source.columnname,source.level,source.tagtemplate,source.tag,source.id,source.createtimestamp,source.tagflag,source.activeflag,'LATEST'
       from
       (select * from `test-datahub.test1.Enterprise_Data_Catalog_Master` where activeflag is true) target right OUTER JOIN
       `test-datahub.test1.Enterprise_Data_Catalog_Master_Landing` source
       ON target.id = source.id WHERE target.id is null


       """
query_job = client.query(query3) 
results = query_job.result()
print("done")
