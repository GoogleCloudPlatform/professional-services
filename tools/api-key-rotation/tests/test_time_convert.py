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

from api_key_rotation_checker.main import time_convert, ApiKey
from datetime import datetime


def test_correct_format_time_convert():
    """
    Validates the time conversion function
    correctly formats time.
    """
    key_object = ApiKey(
        key_id='52b426b4-f56a-4901-855e-235345234',
        display_name='API key 1',
        created_by='None',
        create_time='2021-03-14T18:15:28.914878Z',
        project_id='project123')


    result = time_convert(key_object)
    expected = datetime(2021, 3, 14, 0, 0)
    assert result == expected


def test_incorrect_format_time_convert():
    """
    Validates the time conversion function
    correctly formats time.
    """
    key_object = ApiKey(
        key_id='52b426b4-f56a-4901-855e-235345234',
        display_name='API key 1',
        created_by='None',
        create_time='2021-03-14',
        project_id='project123')

    result = time_convert(key_object)
    bad_format = "2021-03-14T18:15:28.914878Z"
    assert result != bad_format
