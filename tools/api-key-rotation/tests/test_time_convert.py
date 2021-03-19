#
# Copyright 2021 Google LLC.
# This software is provided as is, without warranty or representation for any use or purpose. # pylint: disable = line-too-long
# Your use of it is subject to your agreement with Google.
#

from api_key_rotation_checker.main import time_convert
from dataclasses import dataclass
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

@dataclass
class ApiKey:
    """
    GCP API key class used throughout this script.

    Args:

    key_id - The API key ID
    display_name - The API key display name
    created_by - The user who created the API key (deprecated)
    create_time - The creation date/time of the API key
    project_id - The GCP project where the APi key lives
    """
    key_id: str
    display_name: str
    created_by: str
    create_time: str
    project_id: str