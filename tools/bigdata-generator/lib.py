#   Copyright 2023 Google LLC All Rights Reserved
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

"""Module that contains the different classes used by the Dataflow pipeline"""

import logging
import json
import apache_beam as beam
from google.cloud import storage


class PipelineHelper:
    """Class that encapsulates the logic used by the Dataflow pipeline"""

    def __init__(self, config_file_path):
        self.config = Config(config_file_path=config_file_path)

    def get_batches(self):
        """
        Get batches to be used by RowGenerator
        Example:
        config.total_number_of_rows = 1002
        config.number_of_rows_per_batch = 1000
        result: [1000,2]
        """
        batches = [self.config.number_of_rows_per_batch] * int(self.config.total_number_of_rows
            / self.config.number_of_rows_per_batch)
        batches.append(self.config.total_number_of_rows % self.config.number_of_rows_per_batch)

        return batches

    def get_config(self):
        return self.config


class Config:
    def __init__(self,config_file_path):
        self._parse(
            config_data=self.get_config_data(config_file_path)
        )

    def _parse(self, config_data):
        """
        Parses the config file data
        """
        self.total_number_of_rows = config_data["total_number_of_rows"]
        self.number_of_rows_per_batch = config_data["number_of_rows_per_batch"]

        self.sinks = config_data["sinks"]
        self.lookup_fields = config_data["lookup_fields"]
        self.fields = config_data["fields"]

    def get_config_data(self, config_file_path):
        """
        Reads the config file data from the path provided (local file or GCS URI)
        """
        config_file_json_data = None

        if config_file_path.startswith("gs://"): #GCS
            bucket = config_file_path.split("/")[2] #get the name of the bucket
            object_name = "/".join(config_file_path.split("/")[3:]) # get the name of the object

            #download the contents from GCS
            client = storage.Client()
            bucket = client.get_bucket(bucket)
            blob = bucket.get_blob(object_name)

            config_file_json_data = blob.download_as_string().decode("UTF-8")
        else: #local file
            with open(config_file_path, encoding="UTF-8") as local_json_file:
                config_file_json_data = local_json_file.read()

        return json.loads(config_file_json_data)


class ConfigFileValidator:
    """ This class validates the config file provided to the process"""

    def __init__(self,config: Config):
        self.config = config

    def validate(self):
        """
        Validates the config file
        """
        errors = []
        warnings = []

        total_number_of_rows = int(self.config.total_number_of_rows)
        number_of_rows_per_batch = int(self.config.number_of_rows_per_batch)

        if number_of_rows_per_batch > total_number_of_rows:
            errors.append(
                f"number_of_rows_per_batch ('{number_of_rows_per_batch}') "
                + "is bigger than total_number_of_rows('{total_number_of_rows}')"
            )

        if len(self.config.sinks) == 0:
            warnings.append(
                "no sinks have been defined! data will be not be persisted after generated"
            )

        return errors, warnings


class RowGenerator(beam.DoFn):
    def __init__(self, config):
        self.config = config
        # self.number_of_rows_per_batch = number_of_rows_per_batch

    def process(self, number_of_rows_per_batch):
        """
        Function called by ParDo
        Generates a given amount of rows by following the rules defined in the config file
        """
        from datetime import datetime

        logging.debug("Starting batch")
        metrics = []
        for x in range(0, number_of_rows_per_batch):
            result = {}
            # Generate the values for all fields EXCEPT the LOOKUP_VALUE ones
            for field in self.config.fields:
                if field["generation"]["type"] == "LOOKUP_VALUE":
                    continue

                # logging.debug(f"processing field:{field}")
                field_name = field["name"]

                generation_type = field["generation"]["type"]

                start_time = datetime.now()
                if generation_type == "RANDOM_FROM_REGEX":
                    result[field_name] = self._get_random_from_regex(
                        field=field
                    )
                if generation_type == "RANDOM_BETWEEN":
                    result[field_name] = self._get_random(
                        field=field
                    )
                elif generation_type == "RANDOM_FROM_LIST":
                    result[field_name] = self._get_random_from_list(
                        field=field
                    )
                elif generation_type == "UUID":
                    result[field_name] = self._get_uuid()
                end_time = datetime.now()

                metrics.append({
                    "field": field_name,
                    "runtime": (end_time - start_time).microseconds
                }.copy())

            #Now that we have generated the fields, we can generate the LOOKUP_VALUE ones
            for field in [
                x for x in self.config.fields if x["generation"]["type"] == "LOOKUP_VALUE"
            ]:
                field_name = field["name"]
                start_time = datetime.now()
                result[field_name] = self._get_lookup_value(
                    field=field,
                    row=result
                )
                end_time = datetime.now()

                metrics.append({
                    "field": field_name,
                    "runtime": (end_time - start_time).microseconds
                }.copy())
            yield result

    def _get_random_from_regex(self, field):
        """
        Returns a random string taking as an input a regex expression
        """
        import exrex

        result = str(exrex.getone(field["generation"]["expression"]))
        return result

    def _get_uuid(self):
        """
        Returns a UUID
        """
        import uuid

        uuid_obj = uuid.uuid4()

        return uuid_obj.hex

    def _get_random(self, field):
        """
        Returns different types of random values depending on the data type
        """
        if field["type"] == "STRING":
            return self._get_random_string(
                    subtype=field["generation"]["subtype"],
                    length=field["generation"]["length"]
                )
        elif field["type"] == "INT":
            return self._get_random_int(
                    min=field["generation"]["min"],
                    max=field["generation"]["max"]
                )
        elif field["type"] == "FLOAT":
            return self._get_random_float(
                    min=field["generation"]["min"],
                    max=field["generation"]["max"],
                    num_decimals=field["generation"]["num_decimals"]
                )
        elif field["type"] == "DATETIME":
            return self._get_random_datetime(
                    min=field["generation"]["min"],
                    max=field["generation"]["max"],
                    output_format=field["generation"]["output_format"]
                )

        raise Exception(f"Unknown field type: {field['type']}")

    def _get_random_string(self, subtype, length):
        """
        Returns a random string
        """
        import random
        import string
        return "".join(random.choice(getattr(string, subtype)) for i in range(length))

    def _get_random_int(self, min, max):
        """
        Returns a random int
        """
        import random
        return random.randint(min, max)

    def _get_random_float(self, min, max, num_decimals):
        """
        Returns a random float
        """
        import random
        return round(random.uniform(min, max), num_decimals)

    def _get_random_datetime(self, min, max, output_format):
        """
        Returns a formatted random datatime between 2 input dates
        """
        from datetime import datetime, timedelta
        import random

        min_date = datetime.strptime(min, "%Y-%m-%dT%H:%M:%SZ")
        max_date = datetime.strptime(max, "%Y-%m-%dT%H:%M:%SZ")

        # logging.debug(f"generating random date between: '{min_date}' and '{max_date}'")

        delta = max_date - min_date
        int_delta = (delta.days * 24 * 60 * 60) + delta.seconds
        random_second = random.randrange(int_delta)

        random_date = min_date + timedelta(seconds=random_second)

        return random_date.strftime(output_format)

    def _get_random_from_list(self, field):
        """
        Returns a random value taking a list of values as input
        The input list can be weighted
        """
        import random

        # weights is optional
        weights = field["generation"]["weights"] if field["generation"].get("weights") else None

        result = random.choices(
                field["generation"]["values"],
                weights=weights,
                k=1
            )[0]

        return result

    def _get_lookup_value(self, field, row):
        """
        Returns a value by reading a dictionary
        """
        lookup_field_value =  next(
            (x for x in self.config.lookup_fields
            if x["lookup_name"] == field["generation"]["lookup_name"]),
            None
            )

        if lookup_field_value is None:
            raise Exception(
                f"Can't lookup value for item for field '{field['generation']['lookup_name']}'"
            )

        result = lookup_field_value["mapping"][row[lookup_field_value["source_field_name"]]]

        return result
