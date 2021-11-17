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

from api_key_rotation_checker.main import compare_dates


def test_over_90d_rotate_compare_dates():
    """
    Validates the date comparison function
    work will properly suggest rotation.
    """
    converted_creation_date = "2019-03-16 00:00:00"
    rotation_date = "2020-12-19 10:26:04.827251"

    result = compare_dates(converted_creation_date, rotation_date)
    expected = True
    assert result == expected


def test_under_90d_rotate_compare_dates():
    """
    Validates the date comparison function
    works properly.
    """
    converted_creation_date = "2021-03-16 00:00:00"
    rotation_date = "2020-12-19 10:26:04.827251"

    result = compare_dates(converted_creation_date, rotation_date)
    expected = False
    assert result == expected
