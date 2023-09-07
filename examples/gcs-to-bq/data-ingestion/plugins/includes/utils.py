# Copyright 2023 Google LLC. This software is provided as-is, without warranty
# or representation for any use or purpose. Your use of it is subject to your
# agreement with Google.

import os
import glob
import copy
from yaml import load, CSafeLoader, SafeLoader, dump
from jinja2 import Environment, FileSystemLoader
from includes.loggers import log_warning
from includes.entities import ProcessingConfig, SourceConfig, DestinationConfig, FeedConfig, json_encoder
from includes.exceptions import MissingConfigurationException


def get_local_dag_config_files(config_folder_uri):
    """Return file lists from local folder
    
    Input : config_folder_uri - String
    Output : Yaml file contents - List (string)
    """
    
    # check if the local config exists
    if not os.path.exists(config_folder_uri):
        return None
    
    yaml_configs = []
    
    # root_dir needs a trailing slash (i.e. /root/dir/)
    for filename in glob.iglob(config_folder_uri + '**/**', recursive=True):
        # Check whether file is in yaml or yml     
        if filename.endswith(".yml") or filename.endswith(".yaml"):
            with open(filename, 'r') as f:
                yaml_data = load(f.read(),  Loader=CSafeLoader)
                yaml_configs.append(yaml_data)
        else:
            continue
        
    return yaml_configs


def get_gcs_dag_config_files(config_folder_uri):
    """Return file lists from GCS
    
    Input : config_folder_uri - String
    Output : Yaml file contents - List (string)
    """
    from google.cloud import storage
    
    client = storage.Client()
    
    config_folder_uri_parts = config_folder_uri.split('/')
    if "gs://" in config_folder_uri:
        bucket_name = config_folder_uri_parts[2]
        prefix = '/'.join(config_folder_uri_parts[3:])
    else:
        bucket_name = config_folder_uri_parts[0]
        prefix = '/'.join(config_folder_uri_parts[1:])

    bucket = client.get_bucket(bucket_name)
    dag_config_files = bucket.list_blobs(prefix=prefix)

    yaml_configs = []
    
    for dag_config_file in dag_config_files:
        if dag_config_file.name.endswith(".yml"):
            data = dag_config_file.download_as_bytes()
            yaml_data = load(data,  Loader=CSafeLoader)
            yaml_configs.append(yaml_data)
        else:
            continue
        
    return yaml_configs

def get_gcs_schema_file_content(schema_file_uri):
    """Return the content of the schemafile
    
    Input : schema_file_uri - String
    Output : JSON schema file contents - (String)
    """
    if not schema_file_uri:
        return None
    
    from google.cloud import storage
    import json
    
    client = storage.Client()
   
    try:
        schema_file_uri_parts = schema_file_uri.split('/')
        if "gs://" in schema_file_uri:
            bucket_name = schema_file_uri_parts[2]
            blob_name = '/'.join(schema_file_uri_parts[3:])
        else:
            bucket_name = schema_file_uri_parts[0]
            blob_name = '/'.join(schema_file_uri_parts[1:])

        bucket = client.get_bucket(bucket_name)
        schema_file = bucket.get_blob(blob_name=blob_name)

        data = schema_file.download_as_bytes()
        schema_json = json.loads(data)
        
        return schema_json
    except:
        return None

def parse_dag_configuration(yaml_configs):
    """Parse the yaml configuration from multiple files
    
    Input: dictionary with the configuration (parsed yaml)
    Output: parsed and processed dags config (after applying default values)
    """
    
    ingestion_dags = []
    
    def map_yaml_config_to_conf_object(yaml_config: dict, defaults: dict):
        def get_dict_with_defaults(section: str) -> dict:
            ret = copy.deepcopy(defaults.get(section))  # type: dict
            if not ret:
                ret = {}
            ret.update(yaml_config.get(section, {}))
            return ret

        # set the values
        # name (not to be used, apart from logging / exception handling)
        name = yaml_config.get('name', None)

        source_config = SourceConfig(**get_dict_with_defaults("source_config"))
        destination_config_dict = get_dict_with_defaults("destination_config")
        processing_config_dict = get_dict_with_defaults("processing_config")
        dag_config_dict = get_dict_with_defaults("dag_config")

        try:
            dag_prefix = dag_config_dict["dag_prefix"]
            if not dag_prefix:
                raise MissingConfigurationException(name=name, field="dag_prefix")

            feed_config_dict = {
                "schedule": dag_config_dict["schedule"],
                "dag_id": f"{dag_prefix}_{name}",
                "default_args": {
                    'owner': dag_config_dict["owner"],
                    'start_date': dag_config_dict["start_date"]
                },
                "grouping_level1": dag_config_dict["grouping_level1"]
            }
            
            if "end_date" in dag_config_dict:
                feed_config_dict["default_args"]["end_date"] = dag_config_dict["end_date"]
                
        except KeyError as e:
            raise MissingConfigurationException(name=name, field=e.args)

        if not feed_config_dict["schedule"]:
            raise MissingConfigurationException(name=name, field="schedule")

        return FeedConfig(
            processing_config=ProcessingConfig(**processing_config_dict),
            source_config=source_config,
            destination_config=DestinationConfig(**destination_config_dict) ,
            **feed_config_dict
        )

    # first process raw yaml files (no defaults are known yet)
    unprocessed_yaml_configs = []
    yaml_config_defaults = {}
    for single_yaml_config in yaml_configs:
        if single_yaml_config:
            # process only non-empty files
            if "feeds" in single_yaml_config:
                if isinstance(single_yaml_config["feeds"], list):
                    for feed_config in single_yaml_config["feeds"]:
                        unprocessed_yaml_configs.append(feed_config)
                elif isinstance(single_yaml_config["feeds"], dict):
                    unprocessed_yaml_configs.append(single_yaml_config["feeds"])
            elif "defaults" in single_yaml_config:
                yaml_config_defaults = single_yaml_config["defaults"]
    
    # second process the yamls files with defaults known (if exception has occured, ignore the config element)
    try:
        for yaml_config in unprocessed_yaml_configs:
            ingestion_dags.append(map_yaml_config_to_conf_object(yaml_config, yaml_config_defaults))
    except MissingConfigurationException as ex:
            log_warning(msg=f"{type(ex).__name__} was raised: {ex}")
       
    return ingestion_dags


# WNS: We need to have unique bucket names also available for framework itself and with some configured prefix
# to simplify code promotion between environments

def removesuffix(string, suffix):
    if string.endswith(suffix):
        return string[:-len(suffix)]
    return string

