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
"""Utilities to clean the OCR output."""

import argparse
import ast
import json
import logging
import os
import sys
import yaml

from google.cloud import storage

from utils import gcs_utils


logger = logging.getLogger(__name__)


def open_ocr_output(json_path, gcs_service_account):
    logger.debug('reading json file %s', json_path)
    byte_stream = gcs_utils.download_string(json_path, gcs_service_account)
    raw_json = byte_stream.read()
    return raw_json


def parse_json(raw_json):
    dict_json = ast.literal_eval(raw_json)  # json to dict
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


def postprocess_ocr_file(input_filename, output_filename, gcs_service_account):
    """Parses a raw OCR output and writes result to gcs."""
    raw_json = open_ocr_output(input_filename, gcs_service_account)
    clean_ocr = parse_json(raw_json)
    _ = gcs_utils.upload_string(
        clean_ocr,
        output_filename,
        gcs_service_account)


def postprocess_ocr_folder(input_folder, output_folder, gcs_service_account):
    """Reads a folder of OCR outputs, cleans them and writes results to new folder."""

    storage_client = storage.Client.from_service_account_json(gcs_service_account)
    bucket_name, path = gcs_utils.get_bucket_blob(input_folder)
    bucket = storage_client.get_bucket(bucket_name)

    for file in bucket.list_blobs(prefix=path):

        input_filename = file.name
        filename_prefix = os.path.basename(input_filename)
        if not filename_prefix.endswith('.output-1-to-1.json'):
            logger.info('Excluding file {}'.format(filename_prefix))
            continue
        output_name = filename_prefix.replace('.output-1-to-1.json', '.txt')
        output_path = os.path.join(output_folder, output_name)

        postprocess_ocr_file(
            os.path.join(input_folder, filename_prefix),
            output_path,
            gcs_service_account)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--gcs_folder_ocr_raw',
        help='JSON folder (outputs of OCR).',
        required=True
    )
    parser.add_argument(
        '--gcs_folder_ocr_clean',
        help='JSON folder of clean OCR.',
        required=True
    )
    parser.add_argument(
        '--config_file',
        help='Path to configuration file.',
        required=True
    )
    args = parser.parse_args()

    with open(args.config_file, 'r') as stream:
        config = yaml.load(stream, Loader=yaml.FullLoader)

    postprocess_ocr_folder(
        args.gcs_folder_ocr_raw,
        args.gcs_folder_ocr_clean,
        config['service_keys']['key_bq_and_gcs']
        )
