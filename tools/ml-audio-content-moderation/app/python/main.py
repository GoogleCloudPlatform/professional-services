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
from python.exceptions import CustomError
from python import gcs_transcript_utils


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
            processed_audio_bucket = gcs_transcript_utils.find_bucket(
                bucket_list, 'processed-audio-files')
            files = gcs_transcript_utils.get_files(gcs_client,
                                                   processed_audio_bucket)
            return jsonify(files=files)

        except CustomError as e:
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
            transcript_bucket = gcs_transcript_utils.find_bucket(bucket_list, 'transcript')
            transcript_per_segment = gcs_transcript_utils.get_gcs_transcript(gcs_client,
                                                                             transcript_bucket,
                                                                             file_name)
            if transcript_per_segment:
                transcript = gcs_transcript_utils.extract_full_transcript(transcript_per_segment)
                toxicity_bucket = gcs_transcript_utils.find_bucket(bucket_list,
                                                                   'toxicity')
                toxicity = gcs_transcript_utils.get_gcs_transcript(gcs_client,
                                                                   toxicity_bucket,
                                                                   file_name)

                if toxicity:
                    toxicity.sort(key=lambda text: text['toxicity'],
                                  reverse=True)
                    return jsonify(file_name=file_name,
                                   transcript=transcript,
                                   per_segment_toxicity=toxicity)
                else:
                    exception_message = 'The toxicity for {file} was not found.'
                    raise CustomError(exception_message.format(file=file_name))

            else:
                exception_message = 'The transcript for {file} was not found.'
                raise CustomError(exception_message.format(file=file_name))

        except CustomError as e:
            logging.error(e)
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
            nlp_bucket = gcs_transcript_utils.find_bucket(bucket_list, 'nlp')
            nlp_json = gcs_transcript_utils.get_gcs_transcript(gcs_client,
                                                               nlp_bucket,
                                                               file_name)
            if nlp_json:
                text_section = list(filter(lambda section: section['text'] == text,
                                           nlp_json))
                sentiments = text_section[0]['nlp_response']
                sentiments.sort(key=lambda entity: entity['score'])
                return jsonify(sentiment_result=sentiments)
            else:
                error_message = 'The NLP result for {file} was not found.'
                raise CustomError(error_message.format(file=file_name))

        except CustomError as e:
            logging.error('Fetching entity failed.')
            logging.error(e)
            return jsonify(e.to_dict())


app = Flask(__name__, static_url_path='', static_folder='../angular/dist')
api = Api(app)
api.add_resource(Main, '/')
api.add_resource(Files, '/files')
api.add_resource(Entities, '/entities')
api.add_resource(Analysis, '/analysis')

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8080, debug=True)
