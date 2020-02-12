# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""
`utils.py`
Utility functions.
"""
from datetime import datetime
import importlib
import logging
import os
import re
import sys

import pytz
import yaml

LOGGER = logging.getLogger(__name__)


def parse_config(path):
    """Load a yaml configuration file and resolve environment variables in it.

    Args:
        path (str): the path to the yaml file.

    Returns:
        dict: Parsed YAML dictionary.
    """
    # pattern for global vars: look for ${word}
    pattern = re.compile(r'.*?\${(\w+)}.*?')

    def replace_env_vars(content):
        """Replace environment variables from content.

        Args:
            content (str): String to parse.

        Returns:
            str: the parsed string with the env var replaced.
        """
        match = pattern.findall(content)
        if match:
            full_value = content
            for var in match:
                try:
                    full_value = full_value.replace(f'${{{var}}}',
                                                    os.environ[var])
                except KeyError as exception:
                    LOGGER.error(f'Environment variable "{var}" should be set.')
                    raise exception
            content = full_value
        return content

    with open(path) as config:
        content = config.read()
        content = replace_env_vars(content)
        return yaml.safe_load(content)


def setup_logging():
    """Setup logging for the CLI."""
    debug = os.environ.get("DEBUG", "0")
    print("DEBUG: %s" % debug)
    if debug == "1":
        level = logging.DEBUG
    else:
        level = logging.INFO
    logging.basicConfig(stream=sys.stdout,
                        level=level,
                        format='%(name)s - %(levelname)s - %(message)s',
                        datefmt='%m/%d/%Y %I:%M:%S')
    logging.getLogger('googleapiclient').setLevel(logging.ERROR)


def get_human_time(timestamp, timezone="Europe/Paris"):
    """Get human-readable timestamp from UNIX timestamp.

    Args:
        timestamp (int): UNIX timestamp.

    Returns:
        str: Formatted timestamp in ISO format.
    """
    date = datetime.fromtimestamp(timestamp, pytz.timezone(timezone))
    timeformat = '%Y-%m-%dT%H:%M:%S.%fZ'
    return datetime.strftime(date, timeformat)


def normalize(path):
    """Converts a path to an absolute path.

    Args:
        path (str): Input path.

    Returns:
        str: Absolute path.
    """
    return os.path.abspath(path)


def get_backend_cls(backend):
    """Get backend class.

    Args:
        backend (str): Exporter type.

    Returns:
        class: Backend class.
    """
    return import_dynamic(f'slo_generator.backends.{backend.lower()}',
                          f'{backend.capitalize()}Backend',
                          prefix="backend")


def get_exporter_cls(exporter):
    """Get exporter class.

    Args:
        exporter (str): Backend type.

    Returns:
        class: Exporter class.
    """
    return import_dynamic(f'slo_generator.exporters.{exporter.lower()}',
                          f'{exporter.capitalize()}Exporter',
                          prefix="exporter")


def import_dynamic(package, name, prefix="class"):
    """Import class or method dynamically from package and name.

    Args:
        package: Where the method or class is located in the import path.
        name: Name of method or class.

    Returns:
        obj: Imported class or method object.
    """
    try:
        return getattr(importlib.import_module(package), name)
    except Exception as exception:  # pylint: disable=W0703
        LOGGER.error(
            f'{prefix.capitalize()} "{package}.{name}" not found, check '
            f'package and class name are valid, or that importing it doesn\'t '
            f'result in an exception.')
        LOGGER.debug(exception)
        sys.exit(1)
