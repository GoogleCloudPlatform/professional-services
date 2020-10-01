# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""A setuptools based setup module.

See:
https://packaging.python.org/guides/distributing-packages-using-setuptools/
https://github.com/pypa/sampleproject
"""

import pathlib
from setuptools import setup, find_packages


here = pathlib.Path(__file__).parent

requirements = [
    'pyhive[hive] >= 0.6.1',
    'pymysql >= 0.9.3',
    'google-cloud-bigquery >= 1.9.0, < 2.0.0dev',
    'google-cloud-storage >= 1.14.0, < 2.0.0dev',
    'google-cloud-kms >= 1.0.0, < 2.0.0dev',
    "setuptools >= 34.0.0",
]

setup(
    name='cloud-pso-hive-bigquery',
    version='0.0.2',
    description='hive to bigquery',
    url='https://github.com/GoogleCloudPlatform/professional-services/tree/master/tools/hive-bigquery',
    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: Apache 2',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.5',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
        'Programming Language :: Python :: 3.8',
    ],
    packages=find_packages(where=str(here)),
    python_requires='>=3.5, <4',
    install_requires=requirements
)
