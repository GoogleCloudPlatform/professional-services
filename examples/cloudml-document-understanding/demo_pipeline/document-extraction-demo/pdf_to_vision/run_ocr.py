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
# Wrapper around the file gcs_bucket_pdf_ocr.py to be able to give a config file.

import argparse
import yaml

import gcs_bucket_pdf_ocr


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
  parser.add_argument(
        '--config_file',
        help='Path to configuration file.',
        required=True
    )
  cli_args = parser.parse_args()

  with open(cli_args.config_file, 'r') as stream:
        config = yaml.load(stream, Loader=yaml.FullLoader)
  vars(cli_args)['service_account'] = config['service_keys']['key_bq_and_gcs']
  
  gcs_bucket_pdf_ocr.main(cli_args)
