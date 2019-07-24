# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import httplib2
from oauth2client.service_account import ServiceAccountCredentials
import ConfigParser
import os
import gspread

parser = ConfigParser.SafeConfigParser()

# set up credentials using key file and SDK


def access_set_up(config_file):
    """
    This function sets up credentials based on key file and returns credentials.
    :param config_file: Config file where key file, input label file information etc information are passed
    e.g. update_labels.config
    :return: Credentials object
    """
    parser.read(config_file)
    try:
        key_file = parser.get('property', 'key_file')
    except ConfigParser.NoOptionError:
        print "Please Provide Service Account Key File"
        raise ValueError

    scope = ['https://www.googleapis.com/auth/cloud-platform',
             'https://www.googleapis.com/auth/spreadsheets',
             'https://www.googleapis.com/auth/drive']

    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = key_file

    try:
        credentials = ServiceAccountCredentials.from_json_keyfile_name(key_file, scope)
    except IOError:
        print "Key File Not Found"
        raise IOError
    http = httplib2.Http()
    credentials.authorize(http)
    return credentials


def get_spreadsheet_cells(config_file):
    """
    This function reads the input google sheet and returns all cells values. The first sheet will be read.
    :param config_file: Config file where key file, input label file information etc information are passed
    e.g. update_labels.config
    :return: It returns all_cells of the first sheet.
    """
    parser.read(config_file)
    credentials = access_set_up(config_file)
    try:
        label_file = parser.get('property', 'label_file')
        # noinspection SpellCheckingInspection
        gspread_client = gspread.authorize(credentials)
        sheet = gspread_client.open(label_file).sheet1
        all_cells = sheet.get_all_values()

    except IOError:
        print "Input Label File Not Found"
        raise IOError
    return all_cells


def get_resource_list(config_file):
    parser.read(config_file)
    try:
        resource_list = parser.get('property', resource_list)
    except IOError:
        print "Resource list is not given"
        raise IOError
    return resource_list


def is_header(config_file):
    """
    This function checks if there is header in input file. It returns "Y" or "N".
    Based on that it will skip or not the first row while processing the file.
    :param config_file: Config file where key file, input label file information etc information are passed
    e.g. update_labels.config
    :return: It returns "Y" or "N".
    """
    parser.read(config_file)
    try:
        contains_header = parser.get('property', 'header')
        if contains_header and contains_header.strip().upper().startswith("Y"):
            contains_header = "Y"
    except ConfigParser.NoOptionError:
        contains_header = "N"
    return contains_header


# noinspection SpellCheckingInspection
def create_error_file(scriptname):
    """
    This function create error file with same basename as script name but with extension .err
    :param scriptname: Name of the main calling script.
    :return: Error file name
    """
    basename = os.path.basename(scriptname)
    error_file_basename = os.path.splitext(basename)[0]
    error_file = open(error_file_basename+'.err', 'w')
    return error_file

# create log file name with same basename as script name


# noinspection SpellCheckingInspection
def get_logfile_name(scriptname):
    """
    This function creates log file same as scriptname but with extension .log
    :param scriptname: Name of the main calling script.
    :return: Error file name
    """
    basename = os.path.basename(scriptname)
    log_file_basename = os.path.splitext(basename)[0]
    log_file = log_file_basename+'.log'
    return log_file


