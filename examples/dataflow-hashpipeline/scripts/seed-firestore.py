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
from hashlib import blake2b
from base64 import b64decode
import os
import random
import sys

os.environ["GCLOUD_PROJECT"] = sys.argv[1]
SALT = sys.argv[2]
with open("scripts/key.b64") as f:
  KEY = b64decode(f.read())

def random_ssn():
  # Get a random formatted SSN
  area = f'{random.randrange(1, 799):03d}'

  # SSNs cannot start with 666...because Satan
  if area == '666':
    area = '667'
  group = f'{random.randrange(1, 99):02d}'
  serial = f'{random.randrange(1, 9999):04d}'
  # Save it so we can get some SSNs that we know are in the DB
  ssn = f'{area}-{group}-{serial}'
  
  # Create the BLAKE2 digest which we'll store in Firestore
  digest = blake2b(ssn.replace('-', '').encode('utf-8'), digest_size=16, salt=SALT.encode('utf-8'), key=KEY).hexdigest()
  return (ssn, digest)

db = firestore.Client()
col = db.collection(u'hashed_socials')

socials = []
for i in range(0, 1000):
  ssn, digest = random_ssn()
  socials.append(ssn)
  print(f"Writing test SSN: {ssn}")
  col.document(digest).set({u'exists': True})

print("Writing Test SSNs to scripts/socials.txt")
with open('scripts/socials.txt', 'w') as f:
  for n in socials:
    f.write(f'{n}\n')
