# Copyright 2023 Google. This software is provided as-is, without warranty or
# representation for any use or purpose. Your use of it is subject to your
# agreement with Google.

""" Object name mapping utility"""
import json
import csv
import logging
from config_generator.util.model import Source, Target, NameMap, NameMapItem
from config_generator.util.constants import JSON_CONSTANTS, OBJECT_TYPE


logger = logging.getLogger(__name__)


class MissingColumnError(Exception):
    """
        Raised when a required column is missing from the input CSV file.
    """


class CsvToJson:
    """
    Converts a given input CSV file into a JSON object that maps object names to their corresponding
    BigQuery types. The resulting JSON file can be used in the BQ translation process.

    Args:
        input_file_path (str): Path to the input CSV file.
        output_file_path (str): Path to the output JSON file.
    """

    def __init__(self, source, input_file_path, output_file_path):
        logger.info("Initializing object name mapping config generator")
        self.source = source
        self.input_file_path = input_file_path
        self.output_file_path = output_file_path

    def object_map_prep(self, data) -> NameMap:
        """
        This function converts the 'input_file_name.csv' to json file.
        Args:
            data (list of dictionary): A list of dictionary representing the input CSV file
        """

        # Check for valid columns
        headers = list(data[0].keys())
        self.check_cols(headers)

        # Transform the data to the desired output format
        name_map = []
        default_db = JSON_CONSTANTS.DEFAULT_DATABASE if self.source.lower() in ['hive', 'redshift'] else None

        for row in data:
            type_ = row['type'].upper()
            if type_ == OBJECT_TYPE.DATABASE:
                source = Source(type=type_, database=row['src_db'] if row['src_db'] else default_db)
                target = Target(database=row.get('bq_project', ''))
            elif type_ == OBJECT_TYPE.SCHEMA:
                source = Source(type=type_,
                                database=row['src_db'] if row['src_db'] else default_db,
                                schema=row.get('src_schema', ''))
                target = Target(database=row.get('bq_project', ''),
                                schema=row.get('bq_dataset', ''))
            elif type_ in [OBJECT_TYPE.RELATION, OBJECT_TYPE.FUNCTION]:
                source = Source(type=type_,
                                database=row['src_db'] if row['src_db'] else default_db,
                                schema=row.get('src_schema', ''),
                                relation=row.get('src_relation', ''))
                target = Target(database=row.get('bq_project', ''),
                                schema=row.get('bq_dataset', ''),
                                relation=row.get('bq_table', ''))
            elif type_ == OBJECT_TYPE.RELATION_ALIAS:
                source = Source(type=type_,
                                relation=row.get('src_relation', ''))
                target = Target(relation=row.get('bq_table', ''))
            elif type_ in [OBJECT_TYPE.ATTRIBUTE, OBJECT_TYPE.ATTRIBUTE_ALIAS]:
                source = Source(type=type_, database=row['src_db'] if row['src_db'] else default_db,
                                schema=row.get('src_schema', ''),
                                relation=row.get('src_relation', ''),
                                attribute=row.get('src_attribute', ''))
                target = Target(database=row.get('bq_project', ''),
                                schema=row.get('bq_dataset', ''),
                                relation=row.get('bq_table', ''),
                                attribute=row.get('bq_column', ''))
            else:
                raise ValueError('Incorrect value specified for `type`')

            name_map_item = NameMapItem(source=source, target=target)
            name_map.append(name_map_item)

        return NameMap(name_map=name_map)

    def generate_object_mapping(self) -> None:
        """
        This function writes the converted json to 'output_file_name.json' file.
        """

        # Open the CSV file and read in the data
        with open(self.input_file_path, 'r', encoding='utf=8') as csvfile:
            reader = csv.DictReader(csvfile)
            data = list(reader)

        res = self.object_map_prep(data)
        mapping_json = res.to_dict()

        try:
            with open(self.output_file_path, "w", encoding='utf-8') as writefile:
                json.dump(mapping_json, writefile, indent=4)
        except FileNotFoundError as exc:
            raise FileNotFoundError(f"Failed to write to file: {self.output_file_path}. {exc.strerror}") from exc

        logger.info("JSON config has been successfully created at: %s", self.output_file_path)

    @staticmethod
    def check_cols(header) -> None:
        """
        Validates that the given CSV header row contains all the required columns.

        Args:
            header (list of str): A list of strings representing the header row of an input CSV file

        Raises:
            MissingColumnError: If any of the required columns are missing from the input header row

        """
        required_fields = JSON_CONSTANTS.INPUT_FIELDS

        # Check if each desired column is present in the header row
        missing_columns = [col for col in required_fields if col not in header]
        if missing_columns:
            raise MissingColumnError(f"Columns: {', '.join(missing_columns)} are missing from the input file. "
                                     f"Acceptable columns: {required_fields}")
