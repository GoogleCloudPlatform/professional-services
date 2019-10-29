#!/usr/bin/env python3

# Copyright 2019 Google Inc.
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
"""Main code executing on backend for App Engine."""


import logging
from flask import Flask
from flask import jsonify
from flask import request
from flask import send_from_directory
from flask_restful import Api
from flask_restful import Resource
from python import gcs_transcript_utils
from google.api_core.exceptions import NotFound


class Main(Resource):
    """Main Class for serving index.html"""

    def get(self):
        """Directs frontend to index.html in compliled output directory."""
        return send_from_directory('../angular/dist', 'index.html')


class Files(Resource):
    """File Class retrieves list of available processed files from GCS."""

    def get(self):
        """Fetches list of files from GCS to send to front-end.

        Returns:
            Array of objects holding object name and type for audio files.
        """
        try:
            gcs_client = gcs_transcript_utils.authenticate_gcs()
            bucket_list = list(gcs_client.list_buckets())
            processed_audio_bucket = gcs_transcript_utils.find_bucket_with_prefix(
                bucket_list, 'processed-audio-files')
            files = gcs_transcript_utils.get_files(gcs_client,
                                                   processed_audio_bucket)
            return jsonify(files=files)

        except NotFound as e:
            logging.error(e)
            return jsonify(e.to_dict())

class Analysis(Resource):
    """Analysis Class displays output from all APIs per individual file."""

    def get(self):
        """Fetches transcript and toxicity from GCS to send to frontend.

        Args:
            'file_name': String holding audio file name.

        Returns:
            File_name: String of audio file.
            transcript: String holding entire audio file transcription.
            per_segment_toxicity: Array of objects holding toxicity probability
              per segment, start_time, end_time.
        """
        try:
            file_name = request.args['file_name']
            gcs_client = gcs_transcript_utils.authenticate_gcs()
            bucket_list = list(gcs_client.list_buckets())
            transcript_bucket = gcs_transcript_utils.find_bucket_with_prefix(bucket_list,
                                                                             'transcript')
            transcript_per_segment = gcs_transcript_utils.get_gcs_object(gcs_client,
                                                                         transcript_bucket,
                                                                         file_name)
            if transcript_per_segment:
                transcript_json = transcript_per_segment['json_payload']
                transcript = gcs_transcript_utils.extract_full_transcript(transcript_json)
                output_bucket = gcs_transcript_utils.find_bucket_with_prefix(bucket_list,
                                                                            'output-files')
                toxicity_path = f'toxicity-files/{file_name}'
                toxicity = gcs_transcript_utils.get_gcs_object(gcs_client,
                                                               output_bucket,
                                                               toxicity_path)

                if toxicity:
                    toxicity.sort(key=lambda text: text['toxicity'],
                                  reverse=True)
                    return jsonify(file_name=file_name,
                                   transcript=transcript,
                                   per_segment_toxicity=toxicity)
                else:
                    raise NotFound

            else:
                raise NotFound

        except NotFound as e:
            logging.error(e)
            logging.error('Failed to retrieve analysis.')
            return jsonify(e.to_dict())


class Entities(Resource):
    """Entities Class displays output from NLP API for a specific file."""

    def get(self):
        """Fetches NLP API results from GCS and sends to frontend.

        Args:
            text: String representing section of transcription to get results.
            file_name: String of audio file to retrieve chunk of text from.

        Returns:
            List of entity objects holding type, name, and sentiment score.
        """
        try:
            text = request.args['text']
            file_name = request.args['file_name']
            gcs_client = gcs_transcript_utils.authenticate_gcs()
            bucket_list = list(gcs_client.list_buckets())
            nlp_bucket = gcs_transcript_utils.find_bucket_with_prefix(bucket_list,
                                                                      'output-files')
            nlp_path = f'nlp-files/{file_name}'
            nlp_json = gcs_transcript_utils.get_gcs_object(gcs_client,
                                                           nlp_bucket,
                                                           nlp_path)
            if nlp_json:
                text_section = [section for section in nlp_json if section['text'] == text]
                sentiments = text_section[0]['nlp_response']
                sentiments.sort(key=lambda entity: entity['score'])
                return jsonify(sentiment_result=sentiments)
            else:
                raise NotFound

        except NotFound as e:
            logging.error('Fetching entity failed.')
            logging.error(e)
            return jsonify(e.to_dict())


APP = Flask(__name__, static_url_path='', static_folder='../angular/dist')
API = Api(APP)
API.add_resource(Main, '/')
API.add_resource(Files, '/files')
API.add_resource(Entities, '/entities')
API.add_resource(Analysis, '/analysis')

if __name__ == '__main__':
    APP.run(host='127.0.0.1', port=8080, debug=True)