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
import sys

LOGGER = logging.getLogger(__name__)


def get_human_time(timestamp):
    dt = datetime.fromtimestamp(timestamp)
    timeformat = '%Y-%m-%dT%H:%M:%S.%fZ'
    return datetime.strftime(dt, timeformat)


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
    except Exception:  # pylint: disable=W0703
        LOGGER.error(
            '%s "%s.%s" not found, check the package and class name are valid.',
            prefix.capitalize(), package, name)
        sys.exit(1)
