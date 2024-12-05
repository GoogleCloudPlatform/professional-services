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
    version='2.0.0',
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
        'Programming Language :: Python :: 2.7'
        'Programming Language :: Python :: 3.7'
    ],
    keywords='gcp asset inventory',
    packages=['asset_inventory'],
    setup_requires=['pytest-runner', 'setuptools_scm'],
    extras_require = {
        'testing': ['mock==4.0.3', 'pytest==7.1.3', 'apache-beam[gcp]==2.60.0'],
    },
    include_package_data=True,
    # https://pypi.org/project/google-cloud-asset/#history
    # https://pypi.org/project/google-cloud-bigquery/#history
    # https://pypi.org/project/google-cloud-bigquery/#history
    # https://pypi.org/project/requests-futures/#history
    install_requires=[
        'google-api-python-client==2.151.0',
        'google-cloud-asset==3.27.1',
        'google-cloud-bigquery==3.26.0',
        'requests-futures==1.0.0'
    ],
    use_scm_version = {
        "root": "../..",
        "relative_to": __file__,
        "local_scheme": "node-and-timestamp"
    }
)
