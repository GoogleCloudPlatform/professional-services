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
    name='asset-inventory',
    version='1.0.0',
    description=
    'Generate Cloud Asset Inventory exports and Import To BigQuery.',
    # pylint: disable=line-too-long
    long_description=
    ('Import Cloud Asset Inventory exports'
     '(https://cloud.google.com/resource-manager/docs/cloud-asset-inventory/overview) '
     'into bigquery'
     ),
    url=
    'https://github.com/GoogleCloudPlatform/professional-services/tree/master/tools/asset-inventory',
    author='Ben Menasha',
    author_email='bmenasha@google.com',
    license='apache 2.0',
    classifiers=[
        'Development Status :: 3 - Alpha', 'Intended Audience :: Developers',
        # Apache Beam SDK prevents Python 3 all other code works on Python3.
        'Programming Language :: Python :: 2.7'
    ],
    keywords='gcp asset inventory',
    packages=['asset_inventory'],
    setup_requires=['pytest-runner'],
    tests_require=['mock', 'pytest'],
    include_package_data=True,
    data_files=[('.', ['asset_inventory/cai_to_api_properties.json'])],
    install_requires=[
        'google-api-core',
        'google-apitools',
        'httplib2',
        'oauth2client<4',
        'google-api-python-client',
        'googleapis-common-protos==1.5.3',
        'google-cloud-asset', 'google-cloud-bigquery==1.6.0',
        'requests-futures'
    ])
