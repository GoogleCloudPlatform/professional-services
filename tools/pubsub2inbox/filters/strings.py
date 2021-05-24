#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
import urllib
import json
from datetime import datetime, timezone
from time import mktime
import parsedatetime
from autolink import linkify
from google.cloud import storage
import csv
import io
from tablepyxl import tablepyxl
import base64


def make_list(s):
    if not isinstance(s, list):
        return [s]
    return s


def add_links(s):
    return linkify(s)


def urlencode(s):
    return urllib.parse.quote(s)


def json_encode(v):
    return json.dumps(v)


def csv_encode(v, **kwargs):
    output = io.StringIO()
    csvwriter = csv.writer(output, **kwargs)
    csvwriter.writerow(v)
    return output.getvalue()


def html_table_to_xlsx(s):
    if s.strip() == '':
        return ''
    workbook = tablepyxl.document_to_workbook(s)
    output = io.BytesIO()
    workbook.save(output)
    return base64.encodebytes(output.getvalue()).decode('utf-8')


class InvalidSchemeSignedURLException(Exception):
    pass


def generate_signed_url(url, expiration, **kwargs):
    """Returns a signed URL to a GCS object. URL should be in format "gs://bucket/file"."""
    expiration_parsed = parsedatetime.Calendar().parse(expiration)
    if len(expiration_parsed) > 1:
        expiration = datetime.fromtimestamp(mktime(expiration_parsed[0]),
                                            timezone.utc)
    else:
        expiration = datetime.fromtimestamp(mktime(expiration_parsed),
                                            timezone.utc)

    parsed_url = urllib.parse.urlparse(url)
    if parsed_url.scheme != 'gs':
        raise InvalidSchemeSignedURLException(
            'Invalid scheme for generate_signed_url: %s' % parsed_url.scheme)
    client = storage.Client()

    bucket = client.bucket(parsed_url.netloc)
    blob = bucket.get_blob(parsed_url.path[1:])

    signed_url = blob.generate_signed_url(expiration=expiration,
                                          version='v4',
                                          **kwargs)
    return signed_url
