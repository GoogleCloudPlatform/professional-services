# Copyright 2018 Google Inc. All Rights Reserved.
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

import requests
import six
import main
import pytest

# Url of a test photo.
TEST_PHOTO_URL = (
    'https://c3.staticflickr.com/7/6031/5912463850_12cef58e9d_o.jpg'
  )

@pytest.fixture
def app():
  """Creates an app client."""
  main.app.testing = True
  client = main.app.test_client()
  return client


def test_index(app):
  """Tests homepage."""
  r = app.get('/')
  assert r.status_code == 200


def test_upload_photo(app):
  """Tests uploading a photo."""
  test_photo_data = requests.get(TEST_PHOTO_URL).content
  r = app.post('/upload_photo',
               data={'file': (six.BytesIO(test_photo_data), 'test_photo.jpg')})
  assert r.status_code == 302
