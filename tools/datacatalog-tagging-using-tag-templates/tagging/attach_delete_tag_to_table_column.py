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
import subprocess
from collections import defaultdict
import sys
import tag_util
from google.cloud import datacatalog_v1
import google.cloud as bigquery
from google.api_core import exceptions

class CustomError(Exception):
    """custom exception"""
    # Constructor or Initializer
    def __init__(self, value):
        self.value = value
    # __str__ is to print() the value
    def __str__(self):
        return repr(self.value)


class COLUMNTAGS:
    """class for column tags"""

    def __init__(
        self,
        id1,
        column,
        table,
        projectname,
        datasetname,
        tag_template,
        tag_fields,
        tag,
    ):
        self.id = id1
        self.column = column
        self.table = table
        self.projectname = projectname
        self.datasetname = datasetname
        self.tag_template = tag_template
        self.tag_fields = tag_fields
        self.tag = tag


class TABLETAGS:
    """class for table tags"""

    def __init__(
        self, id1, table, projectname, datasetname, tag_template, tag_fields, tag
    ):
        self.id = id1
        self.table = table
        self.projectname = projectname
        self.datasetname = datasetname
        self.tag_template = tag_template
        self.tag_fields = tag_fields
        self.tag = tag


def delete_tag(config_table):
    """function for deletion of tags"""
    # Opening  table
    try:
        catalogclient = datacatalog_v1.DataCatalogClient()
        client = bigquery.Client()
        job_config = bigquery.QueryJobConfig(use_query_cache=False)
        query = f"""
                SELECT id,projectname,datasetname,tablename,columnname,tagtemplate,level,tag
                FROM {config_table} where upper(mode)="DELETE"
                """
        results = client.query(query, job_config=job_config).result()
        if results.total_rows == 0:
            print("No tags to delete")
        else:
            for row in results:
                id1 = row["id"]
                if row["level"] == "table":
                    search_results = tag_util.search_entries(
                        row["projectname"],
                        row["projectname"]
                        + "."
                        + row["datasetname"]
                        + "."
                        + row["tablename"],
                        row["level"],
                        logs_enabled=True,
                    )
                else:
                    search_results = tag_util.search_entries(
                        row["projectname"],
                        row["columnname"],
                        row["level"],
                        logs_enabled=True,
                    )
                    lst_tables = []
                    colname = row["columnname"]
                    tbl_name = row["tablename"]
                    if row["level"] == "column" and row["tablename"] == "":
                        print(
                            f"Deleting tags for column={colname} in all tables except:"
                        )
                        colquery = f"""
                                SELECT tablename
                                FROM {config_table} where columnname = '{colname}' and tablename != ''
                                """
                        col_results = client.query(
                            colquery, job_config=job_config
                        ).result()
                        if col_results.total_rows != 0:
                            for r in col_results:
                                lst_tables.append(r["tablename"])
                            print(lst_tables)
                    else:
                        print(
                            f"Deleting tags for column={colname} in specific table:{tbl_name}"
                        )
                for search_result in search_results:
                    entry = search_result.relative_resource_name
                    result = catalogclient.list_tags(parent=entry)
                    for response in result:
                        tbl_str = search_result.linked_resource.split("/", 4)[-1]
                        tbl_name = tbl_str[tbl_str.rfind("/") + 1 :]
                        if row["level"] == "table":
                            if (
                                response.template.split("/")[-1] == row["tagtemplate"]
                                and response.column == ""
                            ):
                                catalogclient.delete_tag(name=response.name)
                                print(
                                    f"Tag deleted successfully for table : {tbl_name}"
                                )
                        elif row["level"] == "column" and row["tablename"] != "":
                            if (
                                response.template.split("/")[-1] == row["tagtemplate"]
                                and response.column == row["columnname"]
                            ):
                                if row["tablename"] == tbl_name:
                                    catalogclient.delete_tag(name=response.name)
                                    print(
                                        "Tag deleted successfully for table "
                                        + tbl_name
                                        + " for column : "
                                        + str(response.column)
                                    )
                        elif row["level"] == "column" and row["tablename"] == "":
                            if (
                                response.template.split("/")[-1] == row["tagtemplate"]
                                and response.column == row["columnname"]
                            ):
                                if tbl_name not in lst_tables:
                                    catalogclient.delete_tag(name=response.name)
                                    print(
                                        "Tag deleted successfully for table "
                                        + tbl_name
                                        + " for column : "
                                        + str(response.column)
                                    )

                update_query = f"""UPDATE `test-datahub.test1.Enterprise_Data_Catalog_Master`
                set tagflag=false,activeflag=false,mode='DELETED' WHERE id = '{id1}'
                                AND activeflag is true and mode='DELETE'"""
                query_job = client.query(update_query)
                query_job.result()
    except (exceptions.BadRequest,exceptions.PermissionDenied,exceptions.NotFound) as exception:
        print(f"A {type(exception).__name__} has occurred.")
        print(f"Caught  error: {repr(exception)}")


def attach_config(config_table):
    """function to generate config to tag"""
    allcolumn1 = []
    tbllist1 = []
    specificcolumn1= []
    # Opening  table
    try:
        client = bigquery.Client()
        job_config = bigquery.QueryJobConfig(use_query_cache=False)
        query = f"""
                SELECT id,projectname,datasetname,tablename,columnname,tagtemplate,level,tag
                FROM {config_table} where activeflag is true and tagflag is false
                """
        results = client.query(query, job_config=job_config).result()
        if results.total_rows == 0:
            print("Query gave no results , nothing to tag")
        for row in results:
            if row["level"] == "column" and row["tablename"] == "":
                tag_str = ""
                tag_fields = ""
                for record in row["tag"]:
                    tag_str += "," + record["key"] + "=" + record["value"]
                    tag_fields += "," + record["key"]
                allcolumn1.append(
                    COLUMNTAGS(
                        row["id"],
                        row["columnname"],
                        "",
                        row["projectname"],
                        row["datasetname"],
                        row["tagtemplate"],
                        tag_fields[1:],
                        tag_str[1:],
                    )
                )
            if row["level"] == "column" and row["tablename"] != "":
                tag_str = ""
                tag_fields = ""
                for record in row["tag"]:
                    tag_str += "," + record["key"] + "=" + record["value"]
                    tag_fields += "," + record["key"]
                specificcolumn1.append(
                    COLUMNTAGS(
                        row["id"],
                        row["columnname"],
                        row["tablename"],
                        row["projectname"],
                        row["datasetname"],
                        row["tagtemplate"],
                        tag_fields[1:],
                        tag_str[1:],
                    )
                )
            elif row["level"] == "table":
                tag_str = ""
                tag_fields = ""
                for record in row["tag"]:
                    tag_str += "," + record["key"] + "=" + record["value"]
                    tag_fields += "," + record["key"]
                tbllist1.append(
                    TABLETAGS(
                        row["id"],
                        row["tablename"],
                        row["projectname"],
                        row["datasetname"],
                        row["tagtemplate"],
                        tag_fields[1:],
                        tag_str[1:],
                    )
                )
    except (exceptions.BadRequest,exceptions.PermissionDenied,exceptions.NotFound) as exception:
        print(f"A {type(exception).__name__} has occurred.")
        print(f"Caught  error: {repr(exception)}")
    return specificcolumn1, allcolumn1, tbllist1


def attach_column_tags_to_all(tagging_list):
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
    client = bigquery.Client()
    tagged_resources = defaultdict(list)
    for record in tagging_list:
        column = record.column
        id1 = record.id
        template_name = record.tag_template
        if column not in tagged_resources:
            # Steps to tag column
            search = f"column={column}"
            level = "column"
            search_projects = record.projectname
            tags = record.tag
            print("Tagging for input " + column + " for level " + level)
            stdout, stderr = execute_tagger(
                search, level, search_projects, template_name, record.tag_fields, tags
            )
            if len(stderr.decode("utf-8")) != 0:
                print(stderr.decode("utf-8"))
                column_dict = {
                    "view_id": "",
                    "message": stderr.decode("utf-8").rsplit(": ERROR :", maxsplit=1)[
                        -1
                    ],
                    "tagged": False,
                }
                tagged_resources[column].append(column_dict)
            else:
                print(stdout.decode("utf-8"))
                matches = re.findall(
                    r"projects.*.datasets.*.tables.*", stdout.decode("utf-8")
                )
                for view in matches:
                    column_dict = {
                        "view_id": view,
                        "message": stdout.decode("utf-8").rsplit(":INFO:", maxsplit=1)[
                            -1
                        ],
                        "tagged": True,
                    }
                    tagged_resources[column].append(column_dict)
                update_query = f"""UPDATE `test-datahub.test1.Enterprise_Data_Catalog_Master`
                set tagflag=true WHERE id = '{id1}' AND activeflag is true"""
                # print(update_query)
                query_job = client.query(update_query)
                query_job.result()
    return tagged_resources


def attach_table_tags(tagging_list):
    """function to attach tags to table"""
    client = bigquery.Client()
    tagged_resources = defaultdict(list)

    for record in tagging_list:
        id1 = record.id
        table = record.projectname + "." + record.datasetname + "." + record.table
        template_name = record.tag_template
        # search_results=tagger.search_entries(search_projects,search,level,mode)
        if table not in tagged_resources:
            # Steps to tag table
            search = f"{table}"
            level = "table"
            search_projects = record.projectname
            tags = record.tag
            print("Tagging for input " + table + " for level " + level)
            # search_results=tagger.search_entries(search_projects,search,level,mode)
            stdout, stderr = execute_tagger(
                search, level, search_projects, template_name, record.tag_fields, tags
            )
            if len(stderr.decode("utf-8")) != 0:
                print(stderr.decode("utf-8"))
                column_dict = {
                    "view_id": "",
                    "message": stderr.decode("utf-8").rsplit(": ERROR :", maxsplit=1)[
                        -1
                    ],
                    "tagged": False,
                }
                tagged_resources[table].append(column_dict)
            else:
                print(stdout.decode("utf-8"))
                matches = re.findall(
                    r"projects.*.datasets.*.tables.*", stdout.decode("utf-8")
                )
                for view in matches:
                    column_dict = {
                        "view_id": view,
                        "message": stdout.decode("utf-8").rsplit(":INFO:", maxsplit=1)[
                            -1
                        ],
                        "tagged": True,
                    }
                    tagged_resources[table].append(column_dict)
                update_query = f"""UPDATE `test-datahub.test1.Enterprise_Data_Catalog_Master`
                set tagflag=true WHERE id = '{id1}'
                AND activeflag is true"""
                query_job = client.query(update_query)
                query_job.result()

    return tagged_resources


def attach_column_tags_to_specific(tagging_list):
    """function to tag column to specific column"""
    client = bigquery.Client()
    tagged_resources = defaultdict(list)
    for record in tagging_list:
        id1 = record.id
        column = record.column
        table = record.table
        template_name = record.tag_template
        if column not in tagged_resources:
            # Steps to tag column
            search = f"column={column}"
            level = "column"
            search_projects = record.projectname
            tags = record.tag
            print(
                "Tagging for input "
                + column
                + " for level "
                + level
                + " for table "
                + table
            )
            stdout, stderr = execute_tagger_specific(
                search,
                table,
                level,
                search_projects,
                template_name,
                record.tag_fields,
                tags,
            )
            if len(stderr.decode("utf-8")) != 0:
                print(stderr.decode("utf-8"))
                column_dict = {
                    "view_id": "",
                    "message": stderr.decode("utf-8").rsplit(": ERROR :", maxsplit=1)[
                        -1
                    ],
                    "tagged": False,
                }
                tagged_resources[column].append(column_dict)
            else:
                print(stdout.decode("utf-8"))
                matches = re.findall(
                    r"projects.*.datasets.*.tables.*", stdout.decode("utf-8")
                )
                for view in matches:
                    column_dict = {
                        "view_id": view,
                        "message": stdout.decode("utf-8").rsplit(":INFO:", maxsplit=1)[
                            -1
                        ],
                        "tagged": True,
                    }
                    tagged_resources[column].append(column_dict)
                update_query = f"""UPDATE `test-datahub.test1.Enterprise_Data_Catalog_Master`
                set tagflag=true WHERE id = '{id1}' 
                AND activeflag is true"""
                query_job = client.query(update_query)
                query_job.result()
    return tagged_resources


def execute_tagger(search, level, search_projects, tag_template, tag_fields, tags):
    """executes tag util"""
    try:
        command = [
            "python3",
            "tag_util.py",
            f"--search={search}",
            f"--level={level}",
            f"--search_projects={search_projects}",
            f"--tag_template={tag_template}",
            f"--tag_fields={tag_fields}",
            f"--tags={tags}",
        ]
        process = subprocess.Popen(
            command, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        exit_code = process.wait()
        if exit_code != 0:
            raise CustomError("Failed to call tagger script.")
        return process.communicate()
    except CustomError as error:
        print(error.value)
        stderr = process.communicate()
        print(stderr.decode("utf-8"))
        sys.exit(1)


def execute_tagger_specific(
    search, table, level, search_projects, tag_template, tag_fields, tags
):
    """executes tag util"""
    try:
        command = [
            "python3",
            "tag_util.py",
            f"--search={search}",
            f"--table={table}",
            f"--level={level}",
            f"--search_projects={search_projects}",
            f"--tag_template={tag_template}",
            f"--tag_fields={tag_fields}",
            f"--tags={tags}",
        ]
        process = subprocess.Popen(
            command, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        exit_code = process.wait()
        if exit_code != 0:
            raise CustomError("Failed to call tagger script.")
        return process.communicate()
    except CustomError as error:
        print(error.value)
        stderr = process.communicate()
        print(stderr.decode("utf-8"))
        sys.exit(1)


if __name__ == "__main__":
    TBL = "test-datahub.test1.Enterprise_Data_Catalog_Master"
    specificColumn, allColumn, tbllist = attach_config(TBL)
    all_column_tagged_resources = attach_column_tags_to_all(allColumn)
    table_tagged_resources = attach_table_tags(tbllist)
    specific_column_tagged_resources = attach_column_tags_to_specific(specificColumn)
    delete_tag(TBL)
    print("done")
