# Copyright 2022 Google, LLC.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

import argparse
import json
import logging

from apache_beam import DoFn, ParDo, Pipeline, TaggedOutput
from apache_beam.io import BigQueryDisposition, WriteToBigQuery, WriteToText
from apache_beam.io.fileio import MatchFiles, ReadMatches
from apache_beam.io.filesystems import FileSystems
from apache_beam.io.gcp.gcsio import GcsIO

from corder.bq_schema import CUSTOMER_TABLE_SCHEMA, ORDER_TABLE_SCHEMA


class ParseXMLFilesFn(DoFn):
    """A transform to Parse XMl File object.

    This transform will have 2 outputs:
      - valid xml output: xml content in case if XML is valid.
      - invalid XML output: xml file name in case if XML is invalid
    
    Limitations: This approach works for small files but is not
    parallelizable on super large XML files as they are not read 
    in chunks but in one go. This risks having a single worker dealing
    with very large file instances (slow) and running potentially out of memmory.
    For parsing very large XML files it is recommended to use Beam's XMLIO transform.
    """

    OUTPUT_TAG_VALID_FILE = "valid"
    OUTPUT_TAG_INVALID_FILE = "invalid"

    def process(self, element):
        from xsdata.formats.dataclass.parsers import config
        from xsdata_pydantic.bindings import XmlParser

        from corder.models import Root

        try:
            parser_config = config.ParserConfig(
                base_url=None,
                process_xinclude=False,
                fail_on_unknown_properties=True,
                fail_on_unknown_attributes=True,
            )
            parser = XmlParser(config=parser_config)

            root = parser.from_bytes(element.read(), Root)
            if root.customers is None and root.orders is None:
                raise AttributeError("Customers/Orders not present")
            yield TaggedOutput(self.OUTPUT_TAG_VALID_FILE, root)
        except Exception:
            logging.info("File %s conatins invalid xml input data",
                         element.metadata.path)
            yield TaggedOutput(self.OUTPUT_TAG_INVALID_FILE,
                               element.metadata.path)


class GetItemsFn(DoFn):
    """A transform to Get an json serialized item from colection."""

    def process(self, element, item_collection, item):
        from xsdata_pydantic.bindings import JsonSerializer

        for item_val in getattr(getattr(element, item_collection), item, []):
            yield json.loads(JsonSerializer().render(item_val))


class WriteToFileFn(DoFn):
    """A transform to write invalid XML to Dead Letter Directory."""

    def process(self, element, dead_letter_dir):
        source_file, data = element[0], element[1]
        source_file_base_name = source_file.split("/")[-1]
        target_file_full_path = f"{dead_letter_dir}/{source_file_base_name}"
        if dead_letter_dir.startswith("gs://"):
            with GcsIO().open(filename=target_file_full_path, mode="w") as f:
                f.write(bytes(data))
        else:
            writer = FileSystems.create(target_file_full_path)
            writer.write(bytes(data))
            writer.close()
        yield source_file


class ReadFileFn(DoFn):
    """A transform to Read invalid XML from input location."""

    def process(self, element):
        reader = GcsIO() if element.startswith("gs://") else FileSystems
        with reader.open(element) as f:
            data = f.read()
        yield element, data


class DeleteFileFn(DoFn):
    """A transform to Delete invalid XML from input location."""

    def process(self, element):
        logging.info("Deleting Invalid file, %s", element)
        if element.startswith("gs://"):
            GcsIO().delete(element)
        else:
            FileSystems.delete([element])


def run(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input",
        required=True,
        help="Specify source path, it can be local files or files on GCS",
    )

    parser.add_argument(
        "--output",
        required=True,
        help=
        "Specify output to be a json file(example.json) or BQ dataset (project:dataset)",
    )

    parser.add_argument(
        "--dead_letter_dir",
        required=True,
        help=
        "Specify dead_letter_dir, it can be a dir (/tmp) or a gcs bucket path gs://<some-bucket>",
    )

    known_args, pipeline_args = parser.parse_known_args(argv)
    input, output = known_args.input, known_args.output
    dead_letter_dir = known_args.dead_letter_dir.rstrip("/")

    with Pipeline(argv=pipeline_args) as p:
        # Parse File and tag them into valid and invalid category
        parsed_input_files = (
            p | "Match input files" >> MatchFiles(input) |
            "Read input files" >> ReadMatches() |
            "Check Valid XML Files" >> ParDo(ParseXMLFilesFn()).with_outputs(
                ParseXMLFilesFn.OUTPUT_TAG_VALID_FILE,
                ParseXMLFilesFn.OUTPUT_TAG_INVALID_FILE,
            ))

        # Get customer and order data from valid files
        customers_data = parsed_input_files.valid | "get valid customers" >> ParDo(
            GetItemsFn(), "customers", "customer")

        orders_data = parsed_input_files.valid | "get valid orders" >> ParDo(
            GetItemsFn(), "orders", "order")

        # Write to output
        if ".json" in known_args.output:
            # Write Customers Data to TextFile
            customers_data | "to customer json" >> WriteToText(
                output, "customer", num_shards=0)

            # Write Orders Data to TextFile
            orders_data | "to order json" >> WriteToText(
                output, "order", num_shards=0)

        else:

            # Write Customers Data to BQ Table
            customers_data | "to customer bq" >> WriteToBigQuery(
                "{}.{}".format(output, "customers"),
                schema=CUSTOMER_TABLE_SCHEMA,
                write_disposition=BigQueryDisposition.WRITE_APPEND,
                create_disposition=BigQueryDisposition.CREATE_IF_NEEDED,
            )

            # Write Orders Data to BQ Table
            orders_data | "to order bq" >> WriteToBigQuery(
                "{}.{}".format(output, "orders"),
                schema=ORDER_TABLE_SCHEMA,
                write_disposition=BigQueryDisposition.WRITE_APPEND,
                create_disposition=BigQueryDisposition.CREATE_IF_NEEDED,
            )

        # Write Invalid files to Dead Letter Directory
        (parsed_input_files.invalid |
         "Read Invalid File" >> ParDo(ReadFileFn()) |
         "Write Invalid File to target dir" >> ParDo(WriteToFileFn(),
                                                     dead_letter_dir) |
         "Delete Source Invalid File" >> ParDo(DeleteFileFn()))


if __name__ == "__main__":
    logging.getLogger().setLevel(logging.INFO)
    run()
