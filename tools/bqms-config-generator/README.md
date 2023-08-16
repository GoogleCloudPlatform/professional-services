Copyright 2023 Google. This software is provided as-is, without warranty or representation for any use or purpose. Your use of it is subject to your agreement with Google.

# Bigquery Translation API config generation steps  #

This repo helps is to ease bulk config generation for [dwh migration tool](https://github.com/google/dwh-migration-tools)

This also validates the config json/yaml generated.


- [Quickstart](#quickstart)
- [Installation](#installation)
- [Basic Usage](#basic-usage)

## Quickstart

```shell
# Clone the repo.
git clone https://github.com/GoogleCloudPlatform/professional-services.git

# Change directory to your project directory.
#cd <YOUR_PROJECT_DIRECTORY>
cd professional-services

# Create a virtualenv and install the Python CLI.
python3 -m venv venv
source venv/bin/activate
pip install ./tools/bqms-config-generator

# Remove the example input files from the input directory, if required.
# rm -rf input/*

# Copy the files you would like to translate into the input directory.
cp <YOUR_INPUT_FILES> input/

# Edit the input/conf_prep_path.yaml file appropriately as described in the Basic Usage
# section below.
```

## Installation

Prerequisites: Python >= 3.7.2.

Preferred OS: Linux or MacOS.

```shell
pip install ../bqms-config-generator
```

## Basic Usage
You can run the utility via CLI by executing the `run.sh` script. It accepts one parameter, `conf_prep_path.yaml` file.  

### conf_prep_path.yaml
This file specifies the paths for both ATR_mapping and object_name_mapping CSV files, 
as well as the output directory path for the generated configuration files.
```yaml
input:
    object_mapping: input/object_map.csv
    ATR_mapping: input/hive_bq_datatype_map.csv

output: output/hive/
```

### Run the config generator
```shell
./run.sh -c input/conf_prep_path.yaml
```

----

## Input Files
### Input CSV file for Object Name Mapping

The CSV is expected to have below columns

| COLUMN NAME        | NULLABLE | DESCRIPTION                                                                                                                            |
|--------------------|----------|----------------------------------------------------------------------------------------------------------------------------------------|
| type               | FALSE    | The type of the source database object (e.g., RELATION, SCHEMA, DATABASE, etc)                                                         |
| src_db             | TRUE     | The name of the source database                                                                                                        |
| src_schema         | TRUE     | The name of the schema in the source database                                                                                          |
| src_relation       | FALSE    | The name of the source relation OR an alias for the source relation OR an function applied to the source attribute (e.g., myprocedure) |
| src_attribute      | FALSE    | The name of the source attribute (i.e. column) or an alias for the source attribute                                                    |
| bq_project         | FALSE    | The ID of the Google BigQuery project where the table will be created                                                                  |
| bq_dataset         | FALSE    | The name of the BigQuery dataset where the table will be created                                                                       |
| bq_table           | FALSE    | The name of the target table or an alias for the target table in BigQuery                                                              |
| bq_column          | FALSE    | The name of the target column OR an alias for the target column OR an function name in BigQuery                                        |

### Input CSV file for ATR Mapping

The CSV is expected to have below columns

| COLUMN NAME       | NULLABLE   | DESCRIPTION                                                         |
|-------------------|------------|---------------------------------------------------------------------|
| bq_project        | FALSE      | The name of the BigQuery project                                    |
| bq_dataset        | FALSE      | The name of the BigQuery dataset                                    |
| table_name        | FALSE      | The name of the BigQuery table                                      |
| column_name       | FALSE      | The name of the column in the BigQuery table                        |
| source_datatype   | FALSE      | The data type of the column in the source system                    |
| target_datatype   | FALSE      | The data type of the column in BigQuery                             |
| source_pattern    | TRUE       | The date or datetime pattern of the column in the source system     |
| target_pattern    | TRUE       | The date or datetime pattern of the column in BigQuery              |

## Results
On successful execution, utility generates config files under the output directory mentioned in `conf_prep_path.yaml` file
- object_name_mapping.json 
- ATR_mapping.json

# JSON/YAML Validator #

Validator validates if generated json/yaml is in correct format, along with lint check, it checks if all the required keys are present and also, the data type of values.


### Command to Execute ###

To run the validator we need schema files in order ro check mandatory keys and data type of values

    python3 util/validator.py conf_type generated_conf_file schema_file_path

Refer to below Examples:

For object map JSON:

    python3 util/validator.py object_map output/object_map.json schema/json_schema.json

For ATR config YAML:

    python3 util/validator.py atr_conf output/atr_conf.yaml schema/yaml_schema.json 
