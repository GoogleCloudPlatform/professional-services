import argparse
import json
import logging

import apache_beam as beam
from apache_beam.io import fileio

from corder.bq_schema import CUSTOMER_TABLE_SCHEMA, ORDER_TABLE_SCHEMA


def parse_to_dict(file):
    from xsdata.formats.dataclass.parsers import XmlParser
    from corder.customer_orders_model import Root
    parser = XmlParser()
    root = parser.from_bytes(file.read(), Root)
    yield root


def get_orders(root):
    from xsdata.formats.dataclass.serializers import JsonSerializer
    for order in root.orders.order:
        yield json.loads(JsonSerializer().render(order))


def get_customers(root):
    from xsdata.formats.dataclass.serializers import JsonSerializer
    for customer in root.customers.customer:
        yield json.loads(JsonSerializer().render(customer))


def run(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True, help="Specify source path")

    parser.add_argument(
        '--output',
        required=True,
        help=
        "Specify output to be a json file(example.json) or BQ dataset (project:dataset)"
    )

    known_args, pipeline_args = parser.parse_known_args(argv)
    with beam.Pipeline(argv=pipeline_args) as p:
        records = (p |
                   'Match input files' >> fileio.MatchFiles(known_args.input) |
                   'Read input files' >> fileio.ReadMatches() |
                   'Parse file' >> beam.ParDo(parse_to_dict))

        customers_data = records | "customers" >> beam.ParDo(get_customers)
        orders_data = records | "orders" >> beam.ParDo(get_orders)

        if '.json' in known_args.output:
            customers_data | 'to customer json' >> beam.io.WriteToText(
                known_args.output, "customer", num_shards=0)
            orders_data | 'to order json' >> beam.io.WriteToText(
                known_args.output, "order", num_shards=0)

        else:
            customers_data | 'to customer bq' >> beam.io.WriteToBigQuery(
                "{}.{}".format(known_args.output, "customers"),
                schema=CUSTOMER_TABLE_SCHEMA,
                write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND,
                create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED)
            orders_data | 'to order bq' >> beam.io.WriteToBigQuery(
                "{}.{}".format(known_args.output, "orders"),
                schema=ORDER_TABLE_SCHEMA,
                write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND,
                create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED)


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()
