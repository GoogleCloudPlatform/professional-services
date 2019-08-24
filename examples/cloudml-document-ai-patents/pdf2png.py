# Copyright 2019 Google Inc. All Rights Reserved.
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
from google.cloud import storage, vision
from wand.image import Image
import tensorflow as tf
import yaml

# TODO: Remove temporary file
# TODO: Use tf.file_io --> removes the need to get bucket name.

def png2txt(png_path, txt_path, service_acct):
    """convert the png file to txt using OCR."""
    vision_client = vision.ImageAnnotatorClient.from_service_account_file(
        service_acct)

    image = vision.types.Image()

    storage_client = storage.Client.from_service_account_json(service_acct)
    
    print(f"OCR processing {png_path}")
    image.source.image_uri = png_path
    response = vision_client.text_detection(image=image)

    text = response.text_annotations[0].description
    tmp_filename = txt_path.split("/")[-1]

    temp_txt = f"tmp/{tmp_filename}"
    with open(temp_txt, "w") as f:
        f.write(text)
        f.close()

    print('Writing txt at: {}'.format(txt_path))
    match = re.match(r'gs://([^/]+)/(.+)', txt_path)
    new_bucket_name = match.group(1)
    new_file_name = match.group(2)
    new_blob = storage.Client.from_service_account_json(service_acct).get_bucket(new_bucket_name).blob(new_file_name)
    new_blob.upload_from_filename(temp_txt)

    

def pdf2png2txt(current_blob, png_path, txt_path, service_acct, log_file):
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

    match = re.match(r'gs://([^/]+)/(.+)', png_path)
    new_bucket_name = match.group(1)
    new_file_name = match.group(2)
    new_blob = storage.Client.from_service_account_json(service_acct).get_bucket(new_bucket_name).blob(new_file_name)
    new_blob.upload_from_filename(temp_local_filename)

    #Convert png to txt
    png2txt(png_path, txt_path, service_acct)

    # Delete the temporary file.
    os.remove(temp_local_filename)    


def convert_pdfs(main_project_id, demo_dataset, input_path, service_acct):
    """Converts pdfs to png.

    Args:
      input_path: Folder containing the pdfs (e.g. gs://...)
      service_account: API key needed to access Cloud storage
    """

    input_bucket_name = input_path.replace('gs://', '').split('/')[0]
    bucket = storage.Client.from_service_account_json(service_acct).get_bucket(input_bucket_name)
    
    folder_to_enumerate = input_path.replace(input_bucket_name + '/', '').replace('gs://', '')
    
    png_output_folder = f"gs://{input_bucket_name}/{demo_dataset}/png"
    txt_output_folder = f"gs://{input_bucket_name}/{demo_dataset}/txt"

    log_file_path = os.path.join(png_output_folder, 'corrupted_files.txt')
    log_file = tf.io.gfile.GFile(log_file_path, 'w')

    for blob in bucket.list_blobs(prefix=folder_to_enumerate):
        if (blob.name.endswith('.pdf')):
            print('Converting pdf: {}'.format(blob.name))
            current_blob = storage.Client.from_service_account_json(service_acct).get_bucket(input_bucket_name).get_blob(blob.name)
            png_path = os.path.join(
                png_output_folder,
                os.path.basename(blob.name).replace('.pdf', '.png'))
            txt_path = os.path.join(
                txt_output_folder,
                os.path.basename(blob.name).replace('.pdf', '.txt'))
            print('Writing png at: {}'.format(png_path))
            pdf2png2txt(current_blob, png_path, txt_path, service_acct, log_file)
    log_file.close()

