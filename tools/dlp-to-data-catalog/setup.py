# Copyright 2024 Google LLC
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
"""Configuration for installing the dlp-to-data-catalog-asset package."""

from setuptools import find_packages
from setuptools import setup

setup(
    name='dlp-to-data-catalog-asset',
    version='0.0.1',
    packages=find_packages(),
    py_modules=['dlp.preprocess', 'dlp.catalog', 'dlp.inspection'],
    install_requires=[
        'google-cloud-bigquery >=3.6',
        'google-cloud-dlp >=3.12',
        'google-cloud-datacatalog >=3.11',
        'apache-beam',
        'Pylint>=2.17.2',
        'google-api-core>=1.31.0',
        'cloud-sql-python-connector>=1.2.2',
        'cloud-sql-python-connector[pg8000]',
        'cloud-sql-python-connector[pymysql]',
        'SQLAlchemy>=2.0.11',
    ],
    url='N/A',
    author='N/A',
    author_email='N/A',
)
