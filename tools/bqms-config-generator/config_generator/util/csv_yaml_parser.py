# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.

""" Attribute type transformation utility"""
import logging
import csv
import yaml
from config_generator.util.constants import YAML_CONSTANTS


logger = logging.getLogger(__name__)


class MissingColumnError(Exception):
    """
        Raised when a required column is missing from the input CSV file.
    """


class CsvToYaml:
    """
    To convert csv to yaml configuration for ATR tool
    """

    def __init__(self, source, input_file_path, output_file_path):
        logger.info("Starting csv to yaml generation...")
        self.source = source
        self.input_file_path = input_file_path
        self.output_file_path = output_file_path

    @staticmethod
    def check_row(row):
        """
        Check input rows for valid values
        """
        # Valid column check
        logger.info("Checking valid field values...")
        for field in YAML_CONSTANTS.MANDATORY_INPUT_FIELDS:
            if not row.get(field):
                raise ValueError(f"Missing value for field {field} in row: {row}")

        # Valid pattern check
        source_pattern = row.get('source_pattern', '')
        target_pattern = row.get('target_pattern', '')
        if bool(source_pattern) != bool(target_pattern):
            raise ValueError(
                f"Either both or none of the source_pattern and target_pattern "
                f"should be present in row: {row}")

        # Valid target-type check
        logger.info("Checking valid target-type...")
        supported_types = YAML_CONSTANTS.SUPPORTED_TARGET_TYPES
        if row.get('target_datatype') and row.get('target_datatype').upper() not in supported_types:
            raise ValueError(f"Attribute type conversion needs valid target-type for {row}. "
                             f"\nSupported types: {supported_types}")

    @staticmethod
    def generate_simple_config(row):
        """
        Generates config, if there are valid BigQuery casts available between
        the source type and the target type
        """
        return {
            "match": f"{row['bq_project']}.{row['bq_dataset']}.{row['table_name']}.{row['column_name']}",
            "type": row['target_datatype']
        }

    @staticmethod
    def generate_complex_config(row):
        """
        Generates config, if there are valid BigQuery casts available between
        the source type and the target type
        """
        project, dataset, table_name, column_name, source_datatype, target_datatype, source_pattern, target_pattern = \
            row.values()

        if target_datatype == 'DATETIME':
            source_format = f"parse_datetime('{source_pattern}', cast(? as string))"
            target_format = f"cast(format_datetime('{target_pattern}', ?) as {source_datatype})"
        elif target_datatype == 'DATE':
            source_format = f"parse_date('{source_pattern}', cast(? as string))"
            target_format = f"cast(format_date('{target_pattern}', ?) as {source_datatype})"
        else:
            raise ValueError(f"Unsupported target datatype: {target_datatype}")

        return {
            "match": f"{project}.{dataset}.{table_name}.{column_name}",
            "type": {
                "target": target_datatype,
                "sourceToTarget": source_format,
                "targetToSource": target_format
            }
        }

    def atr_conf_prep(self, data):
        """
        This function converts the CSV to Required YAML file which in turn used in ATR tool
        Args:
              data (list of dictionary): A list of dictionary representing the input CSV file

        """
        # Check for valid columns
        headers = list(data[0].keys())
        self.check_cols(headers)

        # Transform the data to the desired output format
        mapping_yaml = {'type': 'object_rewriter', 'attribute': []}
        for row in data:
            self.check_row(row)

            # check source/target pattern
            if not (row.get('source_pattern') and row.get('target_pattern')):
                # Simple type change
                attribute_item = self.generate_simple_config(row)
            else:
                # Complex type change
                attribute_item = self.generate_complex_config(row)

            mapping_yaml['attribute'].append(attribute_item)

        return mapping_yaml

    @staticmethod
    def check_cols(header):
        """
        Validates that the given CSV header row contains all the required columns.

        The required columns are: 'bq_project', 'bq_dataset', 'table_name', 'column_name',
        'source_datatype', 'target_datatype', 'source_pattern', 'target_pattern'.
        If any of these columns are missing, a MissingColumnError is raised.

        Args:
            header (list of str): A list of strings representing the header row of an input CSV file

        Raises:
            MissingColumnError: If any of the required columns are missing from the input header row

        """

        # Check if each desired column is present in the header row
        required_fields = YAML_CONSTANTS.INPUT_FIELDS
        missing_columns = [col for col in required_fields if col not in header]
        if missing_columns:
            raise MissingColumnError(
                f"Columns: {', '.join(missing_columns)} are missing from the input file. "
                f'Acceptable columns: {required_fields}',
            )

    def generate_atr_conf(self):
        """
        This function writes the converted yaml in given output file.
        """

        # Open the CSV file and read in the data
        with open(self.input_file_path, 'r', encoding='utf=8') as csvfile:
            reader = csv.DictReader(csvfile)
            data = list(reader)


        json_object = self.atr_conf_prep(data)
        self.save_yaml(json_object)

        logger.info("YAML has been successfully created at path: %s", self.output_file_path)

    def save_yaml(self, json_object):
        """
        Writes JSON object to YAML file
        """
        try:
            with open(self.output_file_path, "w", encoding='utf-8') as writefile:
                yaml.dump(json_object, writefile, sort_keys=False)
        except FileNotFoundError as exc:
            raise FileNotFoundError(f"Failed to write to file: {self.output_file_path}. {exc.strerror}") from exc
