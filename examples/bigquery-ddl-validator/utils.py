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
""" Module for reusable utility code """

# Mapping of audit table and db names
metadata_audit_table_dictionary = {
    "hive_metadata_audit_table":"hive_metadata_audit_table",
    "hive_audit_db":"hive_audit_db",
    "snowflake_metadata_audit_table":"snowflake_metadata_audit_table",
    "snowflake_audit_db":"snowflake_metadata_audit_db",
    "teradata_metadata_audit_table":"teradata_metadata_audit_table",
    "teradata_audit_db":"teradata_audit_db",
    "oracle_metadata_audit_table": "oracle_metadata_audit_table",
    "oracle_audit_db":"oracle_audit_db"
}

# Mapping the object type mapping to corresponding names
object_type_db_mapping = {
    "hive" : {
        "table":"MANAGED_TABLE",
        "view":"VIRTUAL_VIEW"
    },
    "teradata" : {
        "table":"T",
        "view":"V",
        "procedure":"P"
    },
    "snowflake" : {
        "table":"T",
        "view":"V",
        "procedure":"P"
    },
    "oracle"  : {
        "table":"T",
        "view":"V",
        "procedure":"P"
    }
}

# Call the audit table information
def fetch_audit_table_information(db_type):
    global metadata_audit_table_dictionary
    if db_type == "h" or db_type == "hive":
        return metadata_audit_table_dictionary["hive_audit_db"], metadata_audit_table_dictionary["hive_metadata_audit_table"]
    elif db_type == "o" or db_type == "oracle":
        return metadata_audit_table_dictionary["oracle_audit_db"], metadata_audit_table_dictionary["oracle_metadata_audit_table"]
    elif db_type == "s" or db_type == "snowflake":
        return metadata_audit_table_dictionary["snowflake_audit_db"], metadata_audit_table_dictionary["snowflake_metadata_audit_table"]
    elif db_type == "t" or db_type == "teradata":
        return metadata_audit_table_dictionary["teradata_audit_db"], metadata_audit_table_dictionary["teradata_metadata_audit_table"]
    else:
        return "incorrect db_type", "incorrect db_type"

# Call the object type mapping information
def fetch_object_type_db_mapping(db_type, obj_type):
    global object_type_db_mapping
    if db_type == "h" or db_type == "hive":
        return object_type_db_mapping["hive"][obj_type]
    elif db_type == "o" or db_type == "oracle":
        return object_type_db_mapping["oracle"][obj_type]
    elif db_type == "s" or db_type == "snowflake":
        return object_type_db_mapping["snowflake"][obj_type]
    elif db_type == "t" or db_type == "teradata":
        return object_type_db_mapping["teradata"][obj_type]
    elif db_type == "o" or db_type == "oracle":
        return object_type_db_mapping["oracle"][obj_type]
    else:
        return "incorrect db_type or obj_type"
