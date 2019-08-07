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
"""Converts all pdf files into png and output the converted png files in the same folder.

Usage: python pdf2png.py --bucket_id={BUCKET_ID} --input_path=/path/to/folder_of_pdfs
"""


import argparse
import json
import os
import sys
import re
import tempfile
from google.cloud import storage
from wand.image import Image
import tensorflow as tf
import yaml

# TODO: Remove temporary file
# TODO: Use tf.file_io --> removes the need to get bucket name.


def pdf_2_png(current_blob, new_path, service_account, log_file):
    """convert the given file using ImageMagick."""
    file_name = current_blob.name
    handler, temp_local_filename = tempfile.mkstemp(dir='tmp/')

    current_blob.download_to_filename(temp_local_filename)
    try:
        with Image(filename=temp_local_filename, resolution=300) as img:
            with img.convert('png') as converted:
                converted.save(filename=temp_local_filename.replace('.pdf', '.png'))
    except:
        print ('Image seems corrupted: {}'.format(file_name))
        log_file.write(file_name)
        return

    match = re.match(r'gs://([^/]+)/(.+)', new_path)
    new_bucket_name = match.group(1)
    new_file_name = match.group(2)
    new_blob = storage.Client.from_service_account_json(service_account).get_bucket(new_bucket_name).blob(new_file_name)
    new_blob.upload_from_filename(temp_local_filename)

    # Delete the temporary file.
    os.remove(temp_local_filename)


def main(input_path, output_folder, service_account):
    """Converts pdfs to png.

    Args:
      input_path: Folder containing the pdfs (e.g. gs://...)
      output_folder: Output folder
      service_account: API key needed to access Cloud storage
    """

    input_bucket_name = input_path.replace('gs://', '').split('/')[0]
    bucket = storage.Client.from_service_account_json(service_account).get_bucket(input_bucket_name)
    
    folder_to_enumerate = input_path.replace(input_bucket_name + '/', '').replace('gs://', '')
    
    log_file_path = os.path.join(output_folder, 'corrupted_files.txt')
    log_file = tf.gfile.GFile(log_file_path, 'w')
    for blob in bucket.list_blobs(prefix=folder_to_enumerate):
        if (blob.name.endswith('.pdf')):
            print('Converting pdf: {}'.format(blob.name))
            current_blob = storage.Client.from_service_account_json(service_account).get_bucket(input_bucket_name).get_blob(blob.name)
            new_path = os.path.join(
                output_folder,
                os.path.basename(blob.name).replace('.pdf', '.png'))
            print ('Writing png at: {}'.format(new_path))
            pdf_2_png(current_blob, new_path, service_account, log_file)
    log_file.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--input_folder',
        help='Folder containing the pdfs.',
        required=True
    )
    parser.add_argument(
        '--output_folder',
        help='Folder containing the output pngs.',
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
    
    main(args.input_folder, args.output_folder, config['service_keys']['key_bq_and_gcs'])
