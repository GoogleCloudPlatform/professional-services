#!/usr/bin/python2
# Copyright 2018 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""pdf->json ocr on an entire GCS folder, with GCP vision api beta.

Given an input and output bucket, run gcp vision api v1p2 pdf->json ocr.
A .csv is also output with the result of the ocr attempt on each file
in the source bucket. Source bucket ignores all non-pdf files and
any files in subfolders.

Settings available by running gcs_bucket_pdf_ocr.py -h

  Typical usage example:

  python gcs_bucket_pdf_ocr.py \
  --gcs-source-uri gs://bucket/path/path \
  --gcs-destination-uri gs://bucket/out_path/path \
  --service-account-path /path/service-account.json
  --batch-size 100 \
  --num-workers 50 \
  --output_report_file pdf_ocr_report.csv
"""

import time
import logging
import argparse
import re
import csv
import os
from collections import defaultdict
from multiprocessing import Pool
from pkg_resources import get_distribution
from google.cloud import storage
from google.cloud import vision_v1p2beta1 as vision


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
  
  os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = gcs_service_account

  gcs_source_uri = force_final_slash(gcs_source_uri)
  gcs_uris_list = []

  # get list of blobs (files) in gcs_source_uri
  storage_client = storage.Client()
  match = re.match(r'gs://([^/]+)/(.+)', gcs_source_uri) # split bucket/path
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


def main(args):
  logging.basicConfig(level=logging.DEBUG,
                      format=("%(asctime)s %(name)s %(levelname)s "
                              "%(processName)s %(message)s"))
  
  logging.info("Arguments: gcs-source-uri %s --gcs-destination-uri %s " 
               "--batch-size %s --num-workers %s --output_report_file %s",
              args.gcs_source_uri, args.gcs_destination_uri, args.batch_size,
              args.num_workers, args.output_report_file)
  
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
  logger.info("Reading file uris from bucket %s", args.gcs_source_uri)
  files_in_gcs_source_uri = list_files_in_gcs_folder(args.gcs_source_uri,
                                                     args.service_account)
  logger.info("cleaning subfolders and non-pdfs from %s", args.gcs_source_uri)
  uris_to_ocr = clean_gcs_uri_list(files_in_gcs_source_uri,
                                   root_uri=args.gcs_source_uri,
                                   extention="pdf",
                                   reporting_dict=reporting_dict)

  logger.info("Creating batches of %i uris from %i uris",
              args.batch_size, len(uris_to_ocr))
  batched_uris_to_ocr = [uris_to_ocr[i:i+args.batch_size] for i in
                         range(0, len(uris_to_ocr), args.batch_size)]
  logger.info("%i batches created", len(batched_uris_to_ocr))

  for batch_number, batch in enumerate(batched_uris_to_ocr):
    logger.info("running batch number %i", batch_number)
    start = time.time()
    ocr_uri_list_threaded(batch, args.gcs_destination_uri, args.num_workers,
                          reporting_dict, args.service_account, 
                          args.output_report_file)
    logger.info("batch time: %f minutes", (time.time() - start) / 60.0)
    
  logger.info("job completed!")


if __name__ == "__main__":

  parser = argparse.ArgumentParser(description=("run all .pdf files in a GCS "
                                                "bucket through the GCP Vision "
                                                "API beta OCR"))
  parser.add_argument("--gcs-source-uri",
                      help=("full gs:// path to folder with pdf files "
                            "to convert to json"),
                      required=True)
  parser.add_argument("--gcs-destination-uri",
                      help=("full gs:// path to folder where json "
                            "output is written"),
                      required=True)
  parser.add_argument("--service-account",
                      help=("full local path to GCP service account .json "
                            "file. see https://cloud.google.com/iam/"
                            "docs/creating-managing-service-account-keys"),
                     required=True)
  parser.add_argument("--batch-size",
                      help=("number of pdf->text calls sent to a "
                            "worker pool before pool is recreated "
                            "and report written, default 100"),
                      type=int,
                      default=100)
  parser.add_argument("--num-workers",
                      help=("number of workers (python processes) "
                            "to run simultaneously, default 5"),
                      type=int,
                      default=5)
  parser.add_argument("--output_report_file",
                      help=("path to output .csv report, row per file "
                            "in --gcs-source-bucket, see code comments "
                            "for report description"),
                      default="gcs_bucket_pdf_ocr_report.csv")

  cli_args = parser.parse_args()
  main(cli_args)
