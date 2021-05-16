from __future__ import absolute_import

from google.cloud import firestore
from datetime import date
from datetime import datetime
from apache_beam.options.pipeline_options import PipelineOptions
from apache_beam.options.pipeline_options import SetupOptions
from dateutil.relativedelta import relativedelta

import argparse
import logging
import re
import io
import pytz
import apache_beam as beam

def run_ttl_job(element):
      
    collection_name_a, ttl_a, ttlcolumn_a = element
    collection_name = collection_name_a.get()
    ttl = ttl_a.get()
    ttl_column = ttlcolumn_a.get()

    if collection_name == "" or collection_name == None:
      logging.error('Collection name not provided. Exiting.')
      return
    if ttl == "" or ttl == None:
      logging.error('TTL (Time to live) is not provided. Exiting.')
      return

    now = datetime.now(pytz.timezone('US/Eastern'))

    ttl_array = ttl.split()
    if (not ttl_array[0].isnumeric()):
      logging.error('Time to Live (TTL) need numeric value e.g. 2 months, 3 years, 10 seconds etc. ')
      return

    if (len(ttl_array) < 2) :
      logging.error('Time to Live (TTL) unit not provided. E.g. 10 seconds, 2 months etc. ')
      return 
      
    unit = ttl_array[1].lower()[0:2]
    if unit == "se":
        ttl_time = now - relativedelta(seconds=int(ttl_array[0]))
    elif unit == "mi":
        ttl_time = now - relativedelta(minutes=int(ttl_array[0]))
    elif unit == "ho" or unit == "hr":
        ttl_time = now - relativedelta(hours=int(ttl_array[0]))
    elif unit == "da":
        ttl_time = now - relativedelta(days=int(ttl_array[0]))
    elif unit == "mo":
        ttl_time = now - relativedelta(months=int(ttl_array[0]))
    elif unit == "ye" or unit == "yr":
        ttl_time = now - relativedelta(years=int(ttl_array[0]))
    else :
        logging.error('Time to Live (TTL) unit is not valid e.g. seconds, minutes, hours, days, months, years. ')
        return
    if ttl_column == "":
      logging.info('Running Firestore TTL job for collection : %s with TTL: %s %s',collection_name,ttl_array[0], ttl_array[1])
      
      db = firestore.Client()
      ttl_docs = db.collection(collection_name).stream()

      for doc in ttl_docs:   
        if (doc.create_time  < ttl_time):
          logging.info('This record is scheduled for deletion: %s time elapsed: %s',doc.id, now - doc.create_time)
          doc.reference.delete()
    else:
      logging.info('Running Firestore TTL job for collection : %s with TTL: %s %s for TTL column: %s',collection_name,ttl_array[0], ttl_array[1], ttl_column)
      
      db = firestore.Client()
      ttl_docs = db.collection(collection_name).where(ttl_column, u"<", ttl_time).stream()

      for doc in ttl_docs:   
        logging.info('This record is scheduled for deletion: %s time elapsed: %s',doc.id, now - doc.create_time)
        doc.reference.delete()

def run(argv=None, save_main_session=True):

  class TTLOptions(PipelineOptions):
    @classmethod
    def _add_argparse_args(cls, parser):
      parser.add_value_provider_argument(
          '--ttl',
          dest='ttl',
          help='TTL value in seconds')
      parser.add_value_provider_argument(
          '--collection',
          dest='collection',
          default='',
          help='Name of collection to apply TTL on')
      parser.add_value_provider_argument(
          '--ttlcolumn',
          dest='ttlcolumn',
          default='',
          required=False,
          help='Column name for reading TTL expiration')

  # We use the save_main_session option because one or more DoFn's in this
  # workflow rely on global context (e.g., a module imported at module level).

  pipeline_options = PipelineOptions(flags=argv, save_main_session=True)
  ttl_options = pipeline_options.view_as(TTLOptions)

  # The pipeline will be run on exiting the with block.
  with beam.Pipeline(options=pipeline_options) as p:
    
    blank_record = p | 'Start' >> beam.Create([(ttl_options.collection, ttl_options.ttl, ttl_options.ttlcolumn)])
    ttl_records = blank_record | 'Call TTL' >> beam.FlatMap(run_ttl_job)
    
if __name__ == '__main__':
  logging.getLogger().setLevel(logging.INFO)
  run()
