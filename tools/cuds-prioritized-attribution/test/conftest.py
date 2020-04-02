# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import sys
import configparser

sys.path.append('../composer/')

config = configparser.ConfigParser(allow_no_value=True)
config.read("pytest.properties")


def pytest_addoption(parser):
    """
    This function is used to get any command line arguments
    :param parser:
    :return:
    """
    pass


def get_test_name_list():
    """
    get list of the test data directories
    :return: list of test case numbers in sorted way
    """
    t_name_list = []
    directory = config['DEFAULT']['test_data_dir']

    print("directory is", directory)
    folders = os.listdir(directory)
    for folder_name in folders:
        if folder_name.startswith('test_'):
            folder_name_suffix = folder_name[5:]
            t_name_list.append(folder_name_suffix)
            t_name_list.sort()
    return t_name_list


def pytest_generate_tests(metafunc):
    """
    This function passes list of test case numbers to testcasenumber parameter in the test_e2e_bq.py script so that test
    cases are parameterized
    :param metafunc: metafunc is a test metadata parameter
    """
    test_name_list = get_test_name_list()
    if "testcasename" in metafunc.fixturenames:
        metafunc.parametrize("testcasename", test_name_list)
