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
import magic
import re
import logging
import hashlib


def make_list(s):
    if not isinstance(s, list):
        return [s]
    return s


def add_links(s):
    return linkify(s)


def urlencode(s):
    return urllib.parse.quote(s)


def re_escape(s):
    return re.escape(s)


def json_encode(v):
    try:
        return json.dumps(v)
    except Exception as exc:
        logger = logging.getLogger('pubsub2inbox')
        logger.error('Exception when trying to encode JSON!',
                     extra={
                         'value': v,
                         'error': str(exc)
                     })
        raise exc


def json_decode(v):
    return json.decode(v)


def b64decode(v):
    return base64.b64decode(v.encode()).decode()


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


def read_gcs_object(url, start=None, end=None):
    parsed_url = urllib.parse.urlparse(url)
    if parsed_url.scheme != 'gs':
        raise InvalidSchemeURLException(
            'Invalid scheme for read_gcs_object(%s): %s' %
            (url, parsed_url.scheme))
    client = storage.Client()

    bucket = client.bucket(parsed_url.netloc)
    blob = bucket.get_blob(parsed_url.path[1:])
    if not blob:
        raise ObjectNotFoundException(
            'Failed to download object %s from bucket %s' %
            (parsed_url.netloc, parsed_url.path[1:]))
    contents = blob.download_as_bytes(start=start, end=end)
    return base64.encodebytes(contents).decode('utf-8')


def filemagic(contents):
    with magic.Magic(flags=magic.MAGIC_MIME_TYPE) as m:
        return m.id_buffer(base64.b64decode(contents))


class ObjectNotFoundException(Exception):
    pass


class InvalidSchemeURLException(Exception):
    pass


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


def hash_string(v, hash_type='md5'):
    h = hashlib.new(hash_type)
    h.update(v.encode('utf-8'))
    return h.hexdigest()
