# Copyright 2019 Google LLC
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

"""Set up file for the cloud environment"""

from setuptools import find_packages
from setuptools import setup

REQUIRED_PACKAGES = [
    'google-cloud-storage==1.14.0',
    'tensorflow==1.12.0',
    'dask[complete]==1.0.0',
    'dill==0.2.8.2',
    'lime==0.1.1.32',
    'six',
]

setup(
    name='trainer',
    version='0.0',
    install_requires=REQUIRED_PACKAGES,
    packages=find_packages(),
    include_package_data=True,
    description='AMLA package'
)
