"""Simple client to test the proxy"""
# Copyright 2024 Google Inc. All Rights Reserved.

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

import os
from flask import Flask, request, send_file
import google.cloud.storage as storage

app = Flask(__name__)

# Configure Google Cloud Storage
storage_client = storage.Client()

@app.route('/upload/<path:bucket_name>', methods=['POST'])
def upload_blob(bucket_name):
    """Uploads a file to the GCS bucket."""
    if 'file' not in request.files:
        return 'No file part', 400

    file = request.files['file']
    if file.filename == '':
        return 'No selected file', 400

    destination_blob_name = file.filename
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_string(file.read(), content_type=file.content_type)

    return f'File {file.filename} uploaded to {bucket_name}/{destination_blob_name}', 201

@app.route('/download/<path:bucket_name>/<path:blob_name>')
def download_blob(bucket_name, blob_name):
    """Downloads a blob from the GCS bucket."""
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(blob_name)

    if not blob.exists():
        return 'Blob not found', 404

    # Create a temporary file to store the downloaded content
    with open('temp_file', 'wb') as temp_file:
        blob.download_to_file(temp_file)

    # Send the file to the client
    response = send_file('temp_file', as_attachment=True, download_name=blob_name)

    # Remove the temporary file after sending
    os.remove('temp_file')

    return response

if __name__ == '__main__':
    app.run(debug=True, port=8000)
