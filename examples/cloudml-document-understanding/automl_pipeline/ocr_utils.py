#!/usr/bin/env python

# Copyright 2019 Google LLC
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

import time
import logging
import argparse
import re
import csv
import os
import ast
import json
from collections import defaultdict
from multiprocessing import Pool
from pkg_resources import get_distribution
from google.cloud import storage
from google.cloud import vision_v1p2beta1 as vision

import gcs_utils


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def async_detect_document_wrapper(gcs_source_uri, gcs_destination_uri,
                                  gcs_service_account):
  """Wrapper to handle logging/reporting for an async ocr call

  Calls async_detect_document, catches the exception,
    and logs results of ocr call

  Args:
    gcs_source_uri: gs:// uri of file to attempt ocr on
    gcs_destination_uri: gs:// uri of where to write .json output
      output-x-to-y.json will be added to the end of this, where
      x is first page in the json and y is the last page. Up to
      100 pages are in each json file
    gcs_service_account: string of a local path to a GCP 
      .json service account file

  Returns:
    dict in format returned by make_report_entry
  """

  # todo(michaelsherman) make this a required argument
  os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = gcs_service_account
  report_entry = {}
  report_entry['uri'] = gcs_source_uri
  try:
    logger.info('ocr starting, file %s to %s',
                gcs_source_uri, gcs_destination_uri)
    response = async_detect_document(gcs_source_uri, gcs_destination_uri)
    logger.info('ocr complete, file %s to %s',
                gcs_source_uri, gcs_destination_uri)
    report_entry['status'] = 'ocr_success'
    report_entry['response'] = response
    return report_entry

  # catching all exceptions for logging, ok per style guide
  except Exception as error: # pylint: disable=broad-except
    logger.warning("exception caught, uri %s, exception %s",
                   gcs_source_uri, repr(error))
    if report_entry is not None:
      report_entry['status'] = 'ocr_failure'
      report_entry['exception'] = repr(error)
    return report_entry


def async_detect_document(gcs_source_uri, gcs_destination_uri):
  """Attempt ocr on a single gs:// uri

  Makes an async call to a gs:// uri to do ocr

  Args:
    gcs_source_uri: gs:// uri of file to attempt ocr on
    gcs_destination_uri: gs:// uri of where to write .json output
      output-x-to-y.json will be added to the end of this, where
      x is first page in the json and y is the last page. Up to
      100 pages are in each json file

  Raises:
    error: catches all Exceptions (should exclude KeyboardInterrupt and other
      trivial exceptions)
  """
  # adapted from https://github.com/GoogleCloudPlatform/python-docs-samples/
  #   blob/7405c0011ef6a691444349a91d8d6e90923f636c/vision/cloud-client/
  #   detect/detect_pdf.py

  try:
    # Supported mime_types are: 'application/pdf' and 'image/tiff'
    mime_type = 'application/pdf'

    # How many pages should be grouped into each json output file.
    batch_size = 100

    client = vision.ImageAnnotatorClient()

    feature = vision.types.Feature(
      type=vision.enums.Feature.Type.DOCUMENT_TEXT_DETECTION)
    gcs_source = vision.types.GcsSource(uri=gcs_source_uri)
    input_config = vision.types.InputConfig(gcs_source=gcs_source,
                                            mime_type=mime_type)

    gcs_destination = vision.types.GcsDestination(uri=gcs_destination_uri)
    output_config = vision.types.OutputConfig(
    gcs_destination=gcs_destination, batch_size=batch_size)

    async_request = vision.types.AsyncAnnotateFileRequest(
      features=[feature],
      input_config=input_config,
      output_config=output_config)

    operation = client.async_batch_annotate_files(requests=[async_request])
    # todo(michaelsherman) catch and log the operation ID
    response = operation.result(timeout=150)
    return response
  # intentional, catch everything and pass up the stack for report
  except Exception as error:
    raise error

def ocr_uri_list_threaded(uri_list_to_ocr, gcs_destination_folder, num_workers,
                          reporting_dict, gcs_service_account,
                          output_report_file=None,):
  """Runs ocr on a batch of gs:// uris and writes a fresh report

  Creates a multiprocessing pool, adds the batch of files, runs the ocr job with
    the given number of workers, and overwrites the output report with the
    latest data on each input file. Ocr output is the 3 letters of the extention
    removed plus the default "output-x-to-x.json".

  Args:
    uri_list_to_ocr: list of gs:// uris to attempt ocr on
    gcs_destination_folder: gs:// uri to write .json output to
    num_workes: number of workers in the multiprocessing pool
    reporting_dict: dictionary, keyed by uri, of dictionaries returned by
      make_report_entry
    gcs_service_account: string of a local path to a GCP 
      .json service account file

  Returns:
    A list, where each item is a file beginning with gcs_source_uri.
  """
  
  pool = Pool(processes=num_workers)
  destination_folder = force_final_slash(gcs_destination_folder)
  return_dict = {}

  for source_uri in uri_list_to_ocr:
    destination_uri = []
    destination_uri.append(destination_folder)
    destination_uri.append(source_uri.split("/")[-1]) # just the filename
    destination_uri = "".join(destination_uri)
    destination_uri = destination_uri[:-3] # remove extention, leave .
    reporting_dict[source_uri]['status'] = 'ocr_call_attempted'
    return_dict[source_uri] = pool.apply_async(async_detect_document_wrapper,
                                               args=(source_uri,
                                                     destination_uri,
                                                     gcs_service_account))

  pool.close()
  pool.join()

  for _, value in return_dict.items():
    returned_report = value.get()
    reporting_dict[returned_report['uri']] = returned_report

  if output_report_file:
    write_output_report(reporting_dict, output_report_file)

def force_final_slash(uri):
  """Add a final / to a string if it doesn't already have one

  Args:
    uri: a string that may or may not end with /

  Returns:
    uri, with a final / character if it didn't already have one
  """

  if not uri.endswith("/"):
    new_uri = []
    new_uri.append(uri)
    new_uri.append("/")
    uri = "".join(new_uri)

  return uri

def force_initial_gs(uri):
  """Add an initial gs:// to a string if it doesn't already have one

  Args:
    uri: a string that may or may not begin with gs://

  Returns:
    uri, with an initial start gs:// if it didn't already have one
  """

  if not uri.startswith("gs://"):
    new_uri = []
    new_uri.append("gs://")
    new_uri.append(uri)
    uri = "".join(new_uri)

  return uri

def list_files_in_gcs_folder(gcs_source_uri,
                             gcs_service_account):
  """Get a list with all files starting with gcs_source_uri

  Get a list of all the files in a gcs bucket starting with gcs_source_uri.
  Includes subfolders and files in the subfolders.

  Args:
    gcs_source_uri: string of a gs:// uri to a folder, where you want to
      list files from.
    gcs_service_account: string of a local path to a GCP 
      .json service account file

  Returns:
    A list, where each item is a file beginning with gcs_source_uri.
  """
  
  #os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = gcs_service_account

  gcs_source_uri = force_final_slash(gcs_source_uri)
  gcs_uris_list = []

  # get list of blobs (files) in gcs_source_uri
  storage_client = storage.Client.from_service_account_json(gcs_service_account)
  match = re.match(r"gs://([^/].+)/(.*)", gcs_source_uri) # split bucket/path
  bucket_name = match.group(1)

  bucket = storage_client.get_bucket(bucket_name)
  folder_path = []
  folder_path.append(match.group(2))
  # "/" append to stop blobs with names that start with folder_path but
  #   that aren't in the folder
  folder_path.append("/")
  blob_list = list(bucket.list_blobs(prefix=folder_path))

  for blob in blob_list:
    file_uri = []
    file_uri.append("gs://")
    file_uri.append(blob.bucket.name)
    file_uri.append("/")
    file_uri.append(blob.name)
    file_uri = "".join(file_uri)
    logger.debug("Found uri %s, adding to list.", file_uri)
    gcs_uris_list.append(file_uri)
  
  return gcs_uris_list


def clean_gcs_uri_list(uri_list_to_clean, root_uri=None,
                       extention=None, reporting_dict=None):
  """Clean uris in subfolders or with the wrong extention from a list of uris

  From a list of uris, remove all uris that don't have a given extention, and
    all uris that are subfolders or files in subfolders from a given root
    uri. Also updates a report

  Args:
    uri_list_to_clean: a list of uris to clean
    root_uri: optional string of a gs:// uri to a folder, only files in this
      folder, and not in any subfolders, will be kept.
    extention: optional string, get only files with paths ending with extention
    reporting_dict: optional dict, if a dict is passed reporting information is
      saved in the dict. Each file found in uri_list_to_clean (including
      subfolders and files in them) gets an entry, where the key is the uri and
      the value is another dict. That nested dict has key 'status', with
      possible values:
        'reject_extention' - uri rejected because it did not end with extention
        'reject_folder' - uri rejected because it is not a file in root_uri
        'accept_uri' - uri is not in a subfolder, and ends with extention

  Returns:
    A list, where each item is a string gs:// uri to a file
  """

  clean_gcs_uris_list = []
  root_uri = force_final_slash(root_uri)

  # later used to eliminate files that are in subfolders
  root_uri_slashes = [i for i, ltr in enumerate(root_uri) if ltr == "/"]

  for file_uri in uri_list_to_clean:
    # used to remove files in subfolders
    file_uri_slashes = [i for i, ltr in enumerate(file_uri) if ltr == '/']

    if not file_uri.startswith(root_uri):
      logger.info("uri %s does not start with %s, will not ocr",
                 file_uri, root_uri)
      if reporting_dict is not None:
        reporting_dict[file_uri] = make_report_entry(uri=file_uri,
                                                     status="reject_folder")
      continue

    if (file_uri_slashes != root_uri_slashes) and root_uri is not None:
      logger.info("%s is in a subfolder (or a subfolder) of %s, will not ocr",
                  file_uri, root_uri)
      if reporting_dict is not None:
        reporting_dict[file_uri] = make_report_entry(uri=file_uri,
                                                     status="reject_folder")
      continue

    if not file_uri.endswith(extention):
      logger.info("uri %s does not end with %s, ignoring.", file_uri, extention)
      if reporting_dict is not None:
        reporting_dict[file_uri] = make_report_entry(uri=file_uri,
                                                     status="reject_extention")
      continue

    else:
      logger.info("uri %s passed checks, will ocr", file_uri)
      if reporting_dict is not None:
        reporting_dict[file_uri] = make_report_entry(uri=file_uri,
                                                     status="accept_uri")
      clean_gcs_uris_list.append(file_uri)

  return clean_gcs_uris_list


def make_report_entry(uri="", status="", response="", exception=""):
  """returns a dictionary for document ocr logging and outcome reporting

  Returned dictionary has fields uri, status, response, and exception,
    all are "" by default but can be set. See main code comments
    for explanation of the fields and statuses

  Args:
    uri: value for uri field, default ""
    status: value for status, default ""
    response: value for response, default ""
    exception: value for exception, default ""

  Returns:
    A dictioray with the four fields and values
  """

  entry_dict = {}
  entry_dict['uri'] = uri
  entry_dict['status'] = status
  entry_dict['response'] = response
  entry_dict['exception'] = exception
  return entry_dict


def write_output_report(reporting_dict, output_report_file):
  """writes a .csv value reporting on the status of the ocr for each file

  Writes to disk a csv with the following columns:
    uri: the gs:// uri of the file found in the input directory
    status: the state of the file
    response: if the file was successfully ocred, the response
    exception: if the ocr failed, the full text of the exception

  Args:
    reporting_dict: dictionary keyed by uri of dictionaries returned by
      make_report_entry
    output_report_file: full path of the csv to write
  """

  keys = sorted(reporting_dict.keys())

  fields = ['uri', 'status', 'response', 'exception']

  with open(output_report_file, 'w') as f:
    w = csv.DictWriter(f, fields)
    w.writeheader()
    for key in keys:
      w.writerow({field: reporting_dict[key].get(field) for field in fields})


def gcs_bucket_pdf_ocr(main_project_id, 
											gcs_source_uri,
											service_acct,
											batch_size=100,
											num_workers=5,
											output_report_file="gcs_bucket_pdf_ocr_report.csv"):
  
  gcs_destination_uri = force_initial_gs(main_project_id + "-lcm/patent_demo_data/json")
  gcs_source_uri = force_initial_gs(gcs_source_uri)

  logging.basicConfig(level=logging.DEBUG,
  	format=("%(asctime)s %(name)s %(levelname)s "
    "%(processName)s %(message)s"))
  
  logging.info("Arguments: gcs-source-uri %s --gcs-destination-uri %s " 
               "--batch-size %s --num-workers %s --output_report_file %s",
              gcs_source_uri, gcs_destination_uri, batch_size,
              num_workers, output_report_file)
  
  reporting_dict = defaultdict(dict)
  """
  reporting_dict stores information about each file in args.gcs_source_uri.
  each entry is a gcs uri, and each value is another dict. That dict has fields:
    'uri' - full gs:// uri to the file/folder
      this is redudant with the key for easy conversion to a csv at output
    'response' - response from a successful ocr call
    'exception' - exception raised by failed ocr call
    'status' - indicates the status of the uri. Possible values:
      'reject_extention' - uri not ocred due to bad extention
      'reject_folder' - uri not ocred due to not being in the given folder.
        includes subfolders, and files in subfolders of the given folder
      'accept_uri' - uri will be ocred
      'ocr_call_attempted' - an ocr call was made, but never finished
      'ocr_failure' - an ocr call was made, but there was an exception
      'ocr_success' - an ocr call was made with a successful response
  """ # pylint: disable=pointless-string-statement
  # pylint bug raises an inappropriate error
  # https://github.com/PyCQA/pylint/issues/1822

  logger.info("Using google-cloud-vision version %s",
             get_distribution("google-cloud-vision").version)
  logger.info("Reading file uris from bucket %s", gcs_source_uri)
  files_in_gcs_source_uri = list_files_in_gcs_folder(gcs_source_uri,
                                                     service_acct)
  logger.info("cleaning subfolders and non-pdfs from %s", gcs_source_uri)
  uris_to_ocr = clean_gcs_uri_list(files_in_gcs_source_uri,
                                   root_uri=gcs_source_uri,
                                   extention="pdf",
                                   reporting_dict=reporting_dict)

  logger.info("Creating batches of %i uris from %i uris",
              batch_size, len(uris_to_ocr))
  batched_uris_to_ocr = [uris_to_ocr[i:i+batch_size] for i in
                         range(0, len(uris_to_ocr), batch_size)]
  logger.info("%i batches created", len(batched_uris_to_ocr))

  for batch_number, batch in enumerate(batched_uris_to_ocr):
    logger.info("running batch number %i", batch_number)
    start = time.time()
    ocr_uri_list_threaded(batch, gcs_destination_uri, num_workers,
                          reporting_dict, service_acct, 
                          output_report_file)
    logger.info("batch time: %f minutes", (time.time() - start) / 60.0)
    
  logger.info("job completed!")

logger = logging.getLogger(__name__)


def open_ocr_output(json_path, gcs_service_account):
  logger.debug('reading json file %s', json_path)
  byte_stream = gcs_utils.download_string(json_path, gcs_service_account)
  raw_json = byte_stream.read()
  return raw_json


def parse_json(raw_json):
  #dict_json = ast.literal_eval(raw_json)  # json to dict
  dict_json = json.loads(raw_json)
  
  full_text = []

  for response in dict_json['responses']:
    if 'fullTextAnnotation' in response.keys():
      if 'text' in response['fullTextAnnotation'].keys():
        full_text.append(response['fullTextAnnotation']['text'])
      else:
        logger.debug('%s has a fullTextAnnotation entry without a text field',
             json_path)
        full_text.append('')
    else:
      logger.debug('%s has a response with no fullTextAnnotation field',
             json_path)
      full_text.append('')

  clean_json = '\n'.join(full_text)

  return clean_json


def postprocess_ocr_file(input_filename, output_filename, service_account):
  """Parses a raw OCR output and writes result to gcs."""
  raw_json = open_ocr_output(input_filename, service_account)
  clean_ocr = parse_json(raw_json)
  _ = gcs_utils.upload_string(
      clean_ocr,
      output_filename,
      service_account)


def postprocess_ocr(main_project_id, service_acct):
  """Reads a folder of OCR outputs, cleans them and writes results to new folder."""

  gcs_source_uri = force_initial_gs(main_project_id + "-lcm/patent_demo_data/json")
  gcs_destination_uri = force_initial_gs(main_project_id + "-lcm/patent_demo_data/txt")

  storage_client = storage.Client.from_service_account_json(service_acct)
  bucket_name, path = gcs_utils.get_bucket_blob(gcs_source_uri)
  bucket = storage_client.get_bucket(bucket_name)

  for file in bucket.list_blobs(prefix=path):
    input_filename = file.name
    filename_prefix = os.path.basename(input_filename)
    if not filename_prefix.endswith('.output-1-to-1.json'):
      logger.info('Excluding file {}'.format(filename_prefix))
      continue
    output_name = filename_prefix.replace('.output-1-to-1.json', '.txt')
    
    output_path = os.path.join(gcs_destination_uri, output_name)
  
    postprocess_ocr_file(
      os.path.join(gcs_source_uri, filename_prefix),
      output_path,
      service_acct)