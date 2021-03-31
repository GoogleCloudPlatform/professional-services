# Copyright 2021 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import argparse
import logging
import base64
import ast
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
from googleapiclient.discovery import build
from google.oauth2 import service_account
from google.auth.transport import requests

TOKEN_URI = 'https://accounts.google.com/o/oauth2/token'
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
EMAIL='<YOUR_GSUITE_ADMIN_EMAIL>'
MESSAGE_ID=''
ATTACHMENT_ID=''
GSUITE_ADMIN_USER = '<YOUR_GSUITE_ADMIN_EMAIL>'
SA_JSON= "<INSERT_SA_JSON_HERE_AS_DICTIONARY_ENTRY_NO_QUOTES_ETC>" 

class WriteAttachmentToGCS(beam.DoFn):
    def __init__(self, output_path):
        self.output_path = output_path

    def getattachment(self, email, messageId, attachementId):

        credentials = Credentials.from_service_account_info(SA_JSON)
        credentials = credentials.with_scopes(SCOPES)
        credentials = credentials.with_subject(email)
        try:
            request = requests.Request()
            credentials.refresh(request)
            gmail = build('gmail', 'v1', credentials=credentials,cache_discovery=False)
            att = gmail.users().messages().attachments().get(userId=email, messageId=messageId, id=attachementId).execute()
            data = base64.b64decode(att['data'])
            return data
        except Exception as ex:
            print('Error:', ex.content.decode('ascii'))

    def process(self, element):
        e = element.decode("UTF-8")
        e = ast.literal_eval(e)
        messageId=e['id']
        att_file_name = ''
        att_text = ''
        for i in range(len(e['payload']['parts'])):
            if ('attachmentId' in e['payload']['parts'][i]['body']):

                attachmentId = e['payload']['parts'][i]['body']['attachmentId']
                att_file_name = e['payload']['parts'][i]['filename']

                for j in range(len(e['payload']['headers'])):
                    if (e['payload']['headers'][j]['name'] == 'To') :
                        em = e['payload']['headers'][j]['value']
                        start = em.find('<') + 1
                        end = em.find('>')
                        em = em[start:end]
                        att_text = self.getattachment(em, messageId, attachmentId)
                        break
                break
                
        filename = self.output_path + att_file_name 
        print('File Name of Attachement:' + filename)
        if (filename):
            with beam.io.gcp.gcsio.GcsIO().open(filename=filename, mode="w") as f:
                f.write(att_text)

def run(input_topic, output_path, window_size=1.0, pipeline_args=None):
    pipeline_options = PipelineOptions(
        pipeline_args, streaming=True, save_main_session=True
    )

    with beam.Pipeline(options=pipeline_options) as pipeline:
        (
            pipeline
            | "Read PubSub Messages"
            >> beam.io.ReadFromPubSub(topic=input_topic)
            | "Write attachment to GCS" >> beam.ParDo(WriteAttachmentToGCS(output_path))
        )

if __name__ == "__main__":  # noqa
    logging.getLogger().setLevel(logging.INFO)

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input_topic",
        help="The Cloud Pub/Sub topic to read from.\n"
        '"projects/<YOUR_PROJECT_ID>/topics/gmail-messages".',
        default="projects/<YOUR_PROJECT_ID>/topics/gmail-messages"
    )
    parser.add_argument(
        "--window_size",
        type=float,
        default=1.0,
        help="Output file's window size in number of minutes.",
    )
    parser.add_argument(
        "--output_path",
        help="GCS Path of the output file including filename prefix.",
        default="gs://<YOUR_BUCKET>/<YOUR_FOLDER>/"
    )
    known_args, pipeline_args = parser.parse_known_args()

    run(
        known_args.input_topic,
        known_args.output_path,
        known_args.window_size,
        pipeline_args,
    )