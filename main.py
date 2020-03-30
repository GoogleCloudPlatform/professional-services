# Copyright 2018 Google LLC
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

# [START gae_python37_bigquery]
import concurrent.futures
import pandas as pd
#import flask
from google.cloud import bigquery
from google.cloud import storage
# using SendGrid's Python Library
# https://github.com/sendgrid/sendgrid-python
import os
import google.auth
import cloudstorage as gcs
from google.cloud import bigquery_storage_v1beta1

# Explicitly create a credentials object. This allows you to use the same
# credentials for both the BigQuery and BigQuery Storage clients, avoiding
# unnecessary API calls to fetch duplicate authentication tokens.


#from sendgrid import SendGridAPIClient
#from sendgrid.helpers.mail import Mail
#app = flask.Flask(__name__)

#@app.route("/")
def main():
    bigquery_client = bigquery.Client()
    bqstorageclient = bigquery_storage_v1beta1.BigQueryStorageClient()
    querys = bigquery_client.query(
        """
        SELECT
        CONCAT(
            'https://stackoverflow.com/questions/',
            CAST(id as STRING)) as url,
        view_count
        FROM `bigquery-public-data.stackoverflow.posts_questions`
        WHERE tags like '%google-bigquery%'
        ORDER BY view_count DESC
        LIMIT 10
    """
    )

    dataframe = (
        querys.result().to_dataframe(bqstorage_client=bqstorageclient)
    )
    print("here")
    print(dataframe.head())
    csv_output=pd.DataFrame.to_csv(dataframe)
    print(csv_output)
    return csv_output
    create_file(self,"results.csv",csv_output)

def create_file(self,filename,data):
    #create a bucket here
    """Create a file.
    The retry_params specified in the open call will override the default
    retry params for this particular file handle.
    Args:
      filename: filename.
    """
    #try:
        # Set a timeout because queries could take longer than one minute.
    #results = query_job.result(timeout=30)
    #print(results)
    bucket_name="exportbq-bucket"
    storage_client = storage.Client(project="ishitashah-ctr-sandbox") 
    bucket = storage_client.create_bucket(bucket_name)
    print("Bucket {} created".format(bucket.name))
    #Upload files to GCP bucket.
    file = gcs_file
    blob = bucket.blob("exportbq")
    blob.upload_from_string(data)
    blob.upload_from_filename(file)

    print('Uploaded {file} to "{bucketName}" bucket.')
    check=blob.exists()
    print(check)

if __name__ == "__main__":
    output=main()


"""
        # Build email message
        message = Mail(
            from_email='test@example.com',
            to_emails='ishitashah@google.com',
            subject='Daily BQ export',
            html_content=flask.render_template("query_result.html", results=results))

        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        
    except concurrent.futures.TimeoutError:
        return flask.render_template("timeout.html", job_id=query_job.job_id)

    except Exception as e:
        return flask.render_template("exception.html", message=e.message) 

    return flask.render_template("response.html", response=response.status_code)


if __name__ == "__main__":
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.
    app.run(host="127.0.0.1", port=8080, debug=True)
# [END gae_python37_bigquery]
"""