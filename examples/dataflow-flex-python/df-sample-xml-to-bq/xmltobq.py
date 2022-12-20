import argparse
import logging

import apache_beam as beam
import apache_beam.io.fileio as fileio


table_schema = {
    'fields': [
        {'name' : 'CustomerID', 'type': 'STRING', 'mode': 'NULLABLE'},
        {'name' : 'EmployeeID', 'type': 'STRING', 'mode': 'NULLABLE'},
        {'name' : 'OrderDate', 'type': 'STRING', 'mode': 'NULLABLE'},
        {'name' : 'RequiredDate', 'type': 'STRING', 'mode': 'NULLABLE'},
        {'name' : 'ShipInfo', 'type': 'RECORD', 'mode': 'NULLABLE', 'fields': [
            {'name' : 'ShipVia', 'type': 'STRING', 'mode': 'NULLABLE'},
            {'name' : 'Freight', 'type': 'STRING', 'mode': 'NULLABLE'},
            {'name' : 'ShipName', 'type': 'STRING', 'mode': 'NULLABLE'},
            {'name' : 'ShipAddress', 'type': 'STRING', 'mode': 'NULLABLE'},
            {'name' : 'ShipCity', 'type': 'STRING', 'mode': 'NULLABLE'},
            {'name' : 'ShipRegion', 'type': 'STRING', 'mode': 'NULLABLE'},
            {'name' : 'ShipPostalCode', 'type': 'STRING', 'mode': 'NULLABLE'},
            {'name' : 'ShipCountry', 'type': 'STRING', 'mode': 'NULLABLE'},
        ]},
    ]
}


def parse_to_dict(file):
    import xmltodict
    from datetime import datetime

    parsed_xml = xmltodict.parse(file.read())
    return [parsed_xml]

def get_orders(doc):
    for order in doc['Root']['Orders']['Order']:
        yield order

def run(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--input',
        required=True,
        help="Specify source path"
    )

    parser.add_argument(
        '--output',
        required=True,
        help="Specify output to be a json file(example.json) or BQ table (project:dataset.table)"
    )

    known_args, pipeline_args = parser.parse_known_args(argv)
    with beam.Pipeline(argv=pipeline_args) as p:
        records = (
            p | 'Match input files' >> fileio.MatchFiles(known_args.input)
              | 'Read input files'  >> fileio.ReadMatches()
              | 'Parse file' >> beam.ParDo(parse_to_dict)
              | 'orders' >> beam.ParDo(get_orders)
        )

        if '.json' in known_args.output:
            records | 'to json' >> beam.io.WriteToText(known_args.output, num_shards=0)

        else:
            records | 'to bq' >> beam.io.WriteToBigQuery(
                known_args.output, schema=table_schema,
                write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND,
                create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED)

if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()