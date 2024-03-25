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

import argparse
import re
import sys
import multiprocessing
from google.cloud import datacatalog_v1

datacatalog = datacatalog_v1.DataCatalogClient()
from google.cloud import bigquery

client = datacatalog_v1.DataCatalogClient()


def parallelize(task, params):
    """Function for parallelize"""
    pool = multiprocessing.Pool(multiprocessing.cpu_count())
    results1 = pool.starmap(task, params)
    return results1


def end_program_execution():
    """Program execution finished"""
    print("Program execution finished.")
    sys.exit(1)


def search_entries(projects, search_string, level, logs_enabled=False):
    """Function to search the entries"""
    level = "table" if level == "column" else level
    # datacatalog = datacatalog_v1.DataCatalogClient()
    scope = datacatalog_v1.types.SearchCatalogRequest.Scope()
    project_list = re.split(";|,", projects) if len(projects) > 1 else projects
    for project_id in project_list:
        scope.include_project_ids.append(project_id)
    search_string = search_string + " " + f"type={level}"
    search_results1 = client.search_catalog(scope=scope, query=search_string)
    pager = client.search_catalog(scope=scope, query=search_string)
    if logs_enabled is True:
        if not search_results1.results:
            print(f"No results found for search query :  {search_string}")
        else:
            print("search results:")
            for result in pager:
                print(result.linked_resource.split("/", 4)[-1])
    return search_results1


def tag_entries(
    dataplex_project_id,
    location_id,
    result,
    level,
    tag_template_id,
    tag_attributes,
    search_string,
):
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
    client1 = datacatalog_v1.DataCatalogClient()
    created_tags = {}
    entry = result.relative_resource_name
    linked_resource = result.linked_resource.split("/", 3)[3]
    tag = datacatalog_v1.types.Tag()
    tag.template = client1.tag_template_path(
        dataplex_project_id, location_id, tag_template_id
    )
    request = datacatalog_v1.GetTagTemplateRequest(name=tag.template)
    if level == "column":
        tag.column = search_string.split("=")[1]

    try:
        tag_template = client1.get_tag_template(request)
    except Exception as exception:
        print(
            f"Exception Name: {type(exception).__name__} Exception Message: {exception}"
        )
        return exception
    for field_id, field_value in tag_template.fields.items():
        created_tags.update({field_id: field_value.type_.primitive_type})
    result = client1.list_tags(parent=entry)
    for response in result:
        if response.template == tag.template and response.column == tag.column:
            tag = response
    tags_list = tag_attributes.split(",")
    # if len(tag_attributes) > 1 else tag
    for tags in tags_list:
        field_id = tags.split("=")[0].strip().lower()
        field_value = tags.split("=")[1].strip()
        if field_id in created_tags.keys():
            if (
                created_tags[field_id]
                == datacatalog_v1.types.FieldType.PrimitiveType.PRIMITIVE_TYPE_UNSPECIFIED
            ):
                tag.fields[field_id] = datacatalog_v1.types.TagField()
                tag.fields[field_id].enum_value.display_name = field_value
            elif (
                created_tags[field_id]
                == datacatalog_v1.types.FieldType.PrimitiveType.STRING
            ):
                tag.fields[field_id] = datacatalog_v1.types.TagField()
                tag.fields[field_id].string_value = field_value
            elif (
                created_tags[field_id]
                == datacatalog_v1.types.FieldType.PrimitiveType.BOOL
            ):
                tag.fields[field_id] = datacatalog_v1.types.TagField()
                if field_value.lower() == "true":
                    tag.fields[field_id].bool_value = 1
                else:
                    tag.fields[field_id].bool_value = 0
            elif (
                created_tags[field_id]
                == datacatalog_v1.types.FieldType.PrimitiveType.DOUBLE
            ):
                tag.fields[field_id] = datacatalog_v1.types.TagField()
                tag.fields[field_id].double_value = field_value
            elif (
                created_tags[field_id]
                == datacatalog_v1.types.FieldType.PrimitiveType.TIMESTAMP
            ):
                tag.fields[field_id] = datacatalog_v1.types.TagField()
                tag.fields[field_id].timestamp_value = field_value
            elif (
                created_tags[field_id]
                == datacatalog_v1.types.FieldType.PrimitiveType.RICHTEXT
            ):
                tag.fields[field_id] = datacatalog_v1.types.TagField()
                tag.fields[field_id].richtext_value = field_value
    # update_mask = FieldMask(paths=["fields"])
    # print(update_mask)
    try:
        for response in result:
            if response.template == tag.template and response.column == tag.column:
                tag.name = response.name
                # request = datacatalog_v1.UpdateTagRequest(tag=tag , update_mask = update_mask)
                request = datacatalog_v1.UpdateTagRequest(tag=tag)
                tag = client1.update_tag(request=request)
                print("Tag already exists, updating the tag")
                print(f"Updated tag : {tag_template_id} for {level} {linked_resource}")
                break
            else:
                request = datacatalog_v1.CreateTagRequest(parent=entry, tag=tag)
                tag = client1.create_tag(request=request)
                print(f"Created tag : {tag_template_id} for {level} {linked_resource}")
    except Exception as exception:
        print(
            f"Exception Name: {type(exception).__name__} Exception Message: {exception}"
        )


if __name__ == "__main__":
    # codeConfig = read_config_json()
    search_results = []
    parser = argparse.ArgumentParser(description="Attachs tags to entities.")
    parser.add_argument(
        "--search", dest="search_string", help="string for assets", required=True
    )
    parser.add_argument(
        "--table", dest="table_filter", help="specific tbl", required=False
    )
    parser.add_argument("--search_projects", dest="projects", required=True)
    parser.add_argument("--level", dest="level", help="Type", required=True)
    parser.add_argument("--tag_template", dest="tag_template_id", required=True)
    parser.add_argument("--tags", dest="tags", help="Tag attributes", required=True)
    parser.add_argument("--tag_fields", dest="tag_fields", required=True)
    parser.add_argument(
        "--mode", dest="mode", default="historical", help="Mode", required=False
    )
    args = parser.parse_args()
    search_results = search_entries(
        args.projects, args.search_string, args.level, logs_enabled=True
    )
    tasks = []
    if args.table_filter is not None:
        for search_result in search_results:
            tbl_str = search_result.linked_resource.split("/", 4)[-1]
            tbl_name = tbl_str[tbl_str.rfind("/") + 1 :]
            if args.table_filter == tbl_name:
                tasks.append(
                    (
                        "test-datahub",
                        "us-central1",
                        search_result,
                        args.level,
                        args.tag_template_id,
                        args.tags,
                        args.search_string,
                    )
                )
                break
    else:
        tbl = []
        if args.level == "column":
            cli = bigquery.Client()
            col = args.search_string.split("=")[1]
            query = f""" SELECT tablename FROM test-datahub.test1.Enterprise_Data_Catalog_Master
            where activeflag is true and tagflag is true and columnname='{col}' and tablename!=''
            """
            query_job = cli.query(query)
            results = query_job.result()
            if results.total_rows != 0:
                for res in results:
                    tbl.append(res["tablename"])
        for search_result in search_results:
            tbl_str = search_result.linked_resource.split("/", 4)[-1]
            tbl_name = tbl_str[tbl_str.rfind("/") + 1 :]
            if tbl_name not in tbl:
                tasks.append(
                    (
                        "test-datahub",
                        "us-central1",
                        search_result,
                        args.level,
                        args.tag_template_id,
                        args.tags,
                        args.search_string,
                    )
                )
    parallelize(tag_entries, tasks)
