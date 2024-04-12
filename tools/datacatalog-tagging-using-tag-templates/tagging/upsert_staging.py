"""
Copyright 2024 Google LLC

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
import argparse
from google.cloud import bigquery


# Construct a BigQuery client object.
BQ_CLIENT = bigquery.Client()

def upsert_function(landingtable,mastertable):
    """
    upsert staging table
    """
    # Soft delete sql
    query1 = f"""
           update {mastertable} set mode='DELETE' , UpdateTimestamp = current_timestamp()
           where id in (
           SELECT  a.id
           FROM (select * from {mastertable} where activeFlag is true ) a
           LEFT JOIN {landingtable} b
              ON a.id = b.id WHERE b.id IS NULL
           and a.activeflag = TRUE) and activeflag = TRUE
           """
    query_job = BQ_CLIENT.query(query1)
    query_job.result()
    # SCD2 - merge
    query2 = f"""
           MERGE {mastertable} target
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
           {mastertable} p,
           unnest(tag)b
           where activeFlag is true
           ) L
           join
           (select
           p.id,
           b.key as tag_key,
           b.value as tag_value,
           from
           {landingtable} p,
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
    query_job = BQ_CLIENT.query(query2)
    query_job.result()
    # Insert sql
    query3 = f"""
           INSERT INTO {mastertable} (projectname,datasetname,tablename,columnname,level,
           tagtemplate,tag,id,createtimestamp,tagflag,activeflag,mode)
           select source.projectname,source.datasetname,source.tablename,source.columnname,source.level,source.tagtemplate,source.tag,source.id,source.createtimestamp,source.tagflag,source.activeflag,'LATEST'
           from
           (select * from {mastertable} where activeflag is true) target right OUTER JOIN
           {landingtable} source
           ON target.id = source.id WHERE target.id is null
           """
    query_job = BQ_CLIENT.query(query3)
    query_job.result()
    print("done")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="upsert details to BQ")
    parser.add_argument(
        "--landingtable", dest="landingtable", help="landingtable name", required=True
    )
    parser.add_argument(
        "--mastertable", dest="mastertable", help="mastertable name", required=True
    )
    args = parser.parse_args()
    upsert_function(args.landingtable,args.mastertable)
