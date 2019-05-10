import httplib2
from oauth2client.service_account import ServiceAccountCredentials
from oauth2client.client import GoogleCredentials
import ConfigParser
import os
import gspread

parser = ConfigParser.SafeConfigParser()

# set up credentials using key file and SDK


def access_set_up(config_file):
    parser.read(config_file)
    try:
        key_file = parser.get('property', 'key_file')
    except ConfigParser.NoOptionError:
        print "Please Provide Service Account Key File"
        exit(1)

    scope = ['https://www.googleapis.com/auth/cloud-platform',
             'https://www.googleapis.com/auth/spreadsheets',
             'https://www.googleapis.com/auth/drive']

    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = key_file

    try:
        credentials = ServiceAccountCredentials.from_json_keyfile_name(key_file, scope)
    except:
        print "Key File Not Found"
        exit(1)
    http = httplib2.Http()
    credentials.authorize(http)
    return credentials

# read input label file from google sheets. The name of the input label file is provided in the config file.
# The first sheet will be read


def get_spreadsheet_cells(config_file):
    parser.read(config_file)
    credentials = access_set_up(config_file)
    try:
        label_file = parser.get('property', 'label_file')
        gspread_client = gspread.authorize(credentials)
        sheet = gspread_client.open(label_file).sheet1
        all_cells = sheet.get_all_values()
    except:
        print "Input Label File Not Found"
        exit(1)
    return all_cells

# read the header Y/N from config file and based on that first line will be skipped or not


def is_header(config_file):
    parser.read(config_file)
    try:
        contains_header = parser.get('property', 'header')
        if contains_header and contains_header.strip().upper().startswith("Y"):
            contains_header = "Y"
    except ConfigParser.NoOptionError:
        contains_header = "N"
    return contains_header

# create error file with same basename as script name


def create_error_file(scriptname):
    basename = os.path.basename(scriptname)
    error_file_basename = os.path.splitext(basename)[0]
    error_file = open(error_file_basename+'.err', 'w')
    return error_file

# create log file name with same basename as script name


def get_logfile_name(scriptname):
    basename = os.path.basename(scriptname)
    log_file_basename = os.path.splitext(basename)[0]
    log_file = log_file_basename+'.log'
    return log_file


