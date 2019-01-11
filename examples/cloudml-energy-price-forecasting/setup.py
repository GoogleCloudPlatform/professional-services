#Copyright 2018 Google LLC
#
#Licensed under the Apache License, Version 2.0 (the "License");
#you may not use this file except in compliance with the License.
#You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
#Unless required by applicable law or agreed to in writing, software
#distributed under the License is distributed on an "AS IS" BASIS,
#WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#See the License for the specific language governing permissions and
#limitations under the License.
# ==============================================================================
"""Sets up the worker nodes.

  Defines needed Python packages as well as the name and version of the setup.
"""

from setuptools import find_packages
from setuptools import setup

# Include any python packages you need to be installed to this list.
REQUIRED_PACKAGES = []

setup(
    name='energy_forecaster',
    version='1.0',
    install_requires=REQUIRED_PACKAGES,
    packages=find_packages(),
    description='This model forecasts hourly energy prices.'
)
