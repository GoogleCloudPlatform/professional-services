#
# Copyright 2021 Google LLC.
# This software is provided as is, without warranty or representation for any use or purpose. # pylint: disable = line-too-long
# Your use of it is subject to your agreement with Google.
#

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

