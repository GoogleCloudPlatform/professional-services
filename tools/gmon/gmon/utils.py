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


def lookup(self, path):
    dotted_path = path.split(".")
    current = self
    for piece in dotted_path:
        current = getattr(current, piece)
    return current


DotMap.lookup = lookup
