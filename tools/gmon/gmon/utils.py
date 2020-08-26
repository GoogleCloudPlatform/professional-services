# Copyright 2020 Google Inc.
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
Command-line interface utils.
"""
import logging
import os
import sys
import warnings
from dotmap import DotMap

from google.auth._default import _CLOUD_SDK_CREDENTIALS_WARNING


def setup_logging():
    """Setup logging for the CLI."""
    debug = os.environ.get("DEBUG", "0")
    if debug == "1":
        level = logging.DEBUG
    else:
        level = logging.INFO
    logging.basicConfig(stream=sys.stdout,
                        level=level,
                        format='%(name)s - %(levelname)s - %(message)s',
                        datefmt='%m/%d/%Y %I:%M:%S')
    logging.getLogger('googleapiclient').setLevel(logging.ERROR)

    # Ingore annoying Cloud SDK warning
    warnings.filterwarnings("ignore", message=_CLOUD_SDK_CREDENTIALS_WARNING)

# pylint: disable=W0123,W0613
def lookup(self, path):
    """Nested lookup of a dotted path.

    Args:
        path (str): A dotted path like 'a.b.c.d'.

    Returns:
        obj: The nested dotmap attribute.

    Example:
        >>> d = {'a': 'b': {'c': 1, 'd': 2}}
        >>> d = DotMap(d)
        >>> d.a.b.c
        1
    """
    return eval(f'self.{path}')


DotMap.lookup = lookup
