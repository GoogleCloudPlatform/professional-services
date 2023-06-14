# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.

"""
Validator checks if JSON/YAML generated is of correct schema
"""
import sys
import yaml
import json
import jsonschema
from jsonschema import validate


def validator( file_type,conf_file_path,schema_file_path ):

        file_validator = {
            "object_map" : validate_object_map,
            "atr_conf" : validate_atr_conf
        }
        is_valid = file_validator[file_type](conf_file_path,schema_file_path)

        json_or_yaml = file_type.upper()
        valid_or_invalid = "Valid" if is_valid else "NOT Valid"
        print("Given {0} file is {1}".format(json_or_yaml,valid_or_invalid))


def schema_validator(jsonData,schema_match):
    try:
        validate(instance=jsonData, schema=schema_match)
    except jsonschema.exceptions.ValidationError as err:
        print("Validation failed due to: {error}}".format(error=err) )
        return False
    return True


def validate_object_map(object_map_json,json_schema):

    jsonData = read_json(object_map_json)
    json_schema_match = read_json(json_schema)

    return schema_validator(jsonData, json_schema_match)


def read_json(file_path):
    try:
        with open(file_path) as text:
            jsonData = json.load(text)
        return jsonData
    except Exception as e:
        print("{file_path} is not valid json, Error: {error}".format(file_path=file_path,error=e))

def read_text(file_path):
    try:
        return open(file_path)
    except Exception as e:
        print("{file_path} is not valid file, Error: {error}".format(file_path=file_path,error=e))


def validate_atr_conf(atrconf_yaml,yaml_schema):
    yaml_schema_match = read_json(yaml_schema)

    text_yaml = yaml.safe_load(read_text(atrconf_yaml))

    return schema_validator(text_yaml, yaml_schema_match)


if __name__ == "__main__":
    validator(sys.argv[1],sys.argv[2],sys.argv[3])