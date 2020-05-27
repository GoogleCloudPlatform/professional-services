#!/usr/bin/env python
# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

from google.cloud import firestore
from google.cloud import secretmanager
from google.api_core.exceptions import NotFound
from base64 import b64decode
from base64 import b64encode
import re
import os
import sys
import hmac
import argparse
import secrets

try:
  from progress.spinner import Spinner
except ImportError:
  os.system("pip install progress --user")
  from progress.spinner import Spinner

class HasherError(Exception):
  pass

class Hasher():
  def __init__(self, argv=None):
    parser = argparse.ArgumentParser(description='Hash and upload SSNs to Firestore')
    parser.add_argument('command', help="One of: upload, verify, create-key")
    parser.add_argument('-p', '--project',
      help="Project ID where the Firestore DB should be initialized")
    parser.add_argument('-S', '--secret',
      help="Fully qualified secret name where the base64 encoded hash key lives")
    parser.add_argument('-s', '--salt',
      help="Salt for use with the HMAC hash.")
    parser.add_argument('-i', '--infile',
      help="Newline-separated list of SSNs to be stored in Firestore. They will be normalized by removing the dash character")
    parser.add_argument('--region',
      help="The region for Firestore. Use `gcloud app regions list` to list available regions",
      default='us-west2')
    parser.add_argument('--collection',
      help="The collection name within the Firestore DB where the Hashed SSNs should be stored",
      default='hashed_socials')
    self.opts = parser.parse_args(argv)
    self.sm = secretmanager.SecretManagerServiceClient()

  def get_hash_key(self):
    try:
      version = self.sm.access_secret_version(f'{self.opts.secret}/versions/latest')
      return b64decode(version.payload.data)
    except NotFound:
      return None

  def set_hash_key(self):
    if self.get_hash_key():
      raise HasherError(f"Error: Refusing to overwrite existing key at {self.opts.secret}/versions/latest")
    key = secrets.token_bytes(64)
    b64 = b64encode(key)
    self.sm.add_secret_version(self.opts.secret, {'data': b64 })

  def hash_ssn(self, ssn, key):
    norm_ssn = ssn.strip().replace('-', '')
    if not re.match(r'[0-9]{9}', norm_ssn):
      raise HasherError(f"Error: Normalized SSN from {norm_ssn} is not a 9 digit number")
    salt = self.opts.salt.encode('utf-8')
    mac = hmac.new(key, msg=salt, digestmod='sha256')
    mac.update(norm_ssn.encode('utf-8'))
    return mac.hexdigest()

  def run(self):
    if self.opts.command == "create-key":
      self.set_hash_key()
      print(f"Saved secret at {self.opts.secret}/versions/latest")
      exit(0)

    os.environ["GCLOUD_PROJECT"] = self.opts.project
    os.system(f"gcloud alpha firestore databases create --project {self.opts.project} --region {self.opts.region}")
    db = firestore.Client()
    col = db.collection(self.opts.collection)
    key = self.get_hash_key()
    if self.opts.command == "upload":
      spinner = Spinner("Hashing and uploading SSNs...")
      for ssn in open(self.opts.infile):
        digest = self.hash_ssn(ssn, key)
        col.document(digest).set({u'exists': True})
        spinner.next()
      spinner.finish()
      print("Done!")
    elif self.opts.command == 'verify':
      spinner = Spinner("Verifying and counting SSNs...")
      count = 0
      for ssn in open(self.opts.infile):
        digest = self.hash_ssn(ssn, key)
        doc = col.document(digest).get()
        spinner.next()
        if doc.exists:
          count += 1
      spinner.finish()
      print(f"Found {count} valid SSNs")
    else:
      raise HasherError(f'Error: Invalid command {self.opts.command}, must be one of "verify", "upload", "create-key"')

if __name__ == '__main__':
  try:
    Hasher(sys.argv[1:]).run()
  except HasherError as err:
    print(err)
    exit(1)
