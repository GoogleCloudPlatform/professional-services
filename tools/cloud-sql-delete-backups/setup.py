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

from setuptools import setup

setup(
    name='cloud-sql-delete-backups',
    version='1.0.0',
    description=
    'Delete Cloud SQL On-Demand Backups.',
    long_description=
    ('Delete Cloud SQL On-Demand Backups'
     ' older then input number of days.'
     ),
    url='',
    author='Ben Menasha',
    author_email='bmenasha@google.com',
    license='apache 2.0',
    classifiers=[
        'Development Status :: 3 - Alpha', 'Intended Audience :: Developers',
        'Programming Language :: Python :: 3.7'
    ],
    keywords='gcp cloud sql',
    packages=['cloud_sql_delete_backups'],
    setup_requires=['pytest-runner'],
    tests_require=['mock', 'pytest'],
    include_package_data=True,
    install_requires=[
        'google-api-python-client',
        'oauth2client',
        'httplib2'
    ])
