# Copyright 2021 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Common util functions."""

import datetime
import logging
import random
import re
import string
import sys
import yaml

import pkg_resources

_FORMATTER = logging.Formatter(
    '%(levelname)8s - %(lineno)4s:%(filename)30s - %(message)s')


def abs_filepaths(paths):
    """Return absolute filepaths for the given input paths.

    Args:
        paths: list of str, filepath names.

    Yields:
        str, absolute filepath name.
    """
    for path in paths:
        filepath = pkg_resource_filename(path)
        yield filepath


def pkg_resource_filename(path):
    """Return absolute filepath for the given input path.

    Args:
        path: str, filepath name.

    Returns
        str, absolute filepath name.
    """
    path_vals = path.split('/')
    abs_filename = pkg_resources.resource_filename('.'.join(path_vals[:-1]),
                                                   path_vals[-1])
    return abs_filename


def log_to_console(level=logging.INFO):
    """Output logging statements to stdout.

    Args:
        level: logging level.
    """
    has_stdout = False
    logr = logging.getLogger()
    for handler in logr.handlers:
        if handler.stream == sys.stdout:
            has_stdout = True
            break

    if not has_stdout:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(_FORMATTER)
        logr.addHandler(handler)
    logr.setLevel(level)


def process_yaml(filepath):
    """Process yaml at filepath and return an object.

    Args:
      filepath: str, file path for the YAML file.

    Returns:
      object, yaml data as dict.
    """
    logging.info('Processing yaml file: %s', filepath)
    data = {}
    try:
        with open(filepath, 'r') as cfile:
            data = yaml.load(cfile.read(), Loader=yaml.SafeLoader)
    except FileNotFoundError:
        logging.error('No file exists at path: %s', filepath)
    return data


def process_yaml_from_text(yaml_text):
    """Process yaml from given string data.

    Args:
      yaml_text: str, input for yaml processing.

    Returns:
      object, yaml data as dict.
    """
    data = yaml.load(yaml_text, Loader=yaml.SafeLoader)
    return data


def today():
    """Returns datetime as yyyy-mm-dd format."""
    return datetime.datetime.now().strftime('%Y-%m-%d')


def timestamp():
    """Return timestamp in yyyy-mm-dd hh:mm:ss format"""
    return datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')


def zulu_timestamp(delta_days=0, delta_seconds=60):
    """Return timestamp in zulu format."""
    now = datetime.datetime.now()
    delta = datetime.timedelta(days=delta_days, seconds=delta_seconds)
    time = now + delta
    return time.strftime('%Y-%m-%dT%H:%M:%S.%fZ')


def seconds_in_a_day():
    """Return total seconds(int) in a day."""
    return 60 * 60 * 24


def is_date_in_zulu_format(date_str):
    """Check if the given input date string is in zulu format.

    Args:
        date_str: str, date string.

    Returns: bool.
    """
    pattern = re.compile(
        r'^\d{4}-+\d{2}-+\d{2}T+\d{2}:+\d{2}:+\d{2}.+\d{1,}Z+$')
    matched = pattern.match(date_str)
    return matched


def get_unique_id():
    """Generate a unique id."""
    char_set = string.ascii_uppercase + string.digits
    return ''.join(random.choice(char_set) for _ in range(32))
