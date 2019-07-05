# Copyright 2017 Google Inc.
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
    name='dns_sync',
    version='1.2.0',
    description='Sync a Google Cloud DNS zone with GCE resources',
    long_description=('Listens for compute engine audit events'
                      'for load blaancers or instances creation and '
                      'deletes or creates dns records in a Cloud DNS zone.'),
    # supply use github url when it exists
    # url='',
    author='Ben Menasha',
    author_email='bmenasha@google.com',
    license='apache 2.0',
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Intended Audience :: Developers',
        'Programming Language :: Python :: 2.7'],
    keywords='google cloud dns gce',
    packages=['dns_sync'],
    setup_requires=['pytest-runner'],
    tests_require=['mock', 'pytest'],
    install_requires=['google-cloud-datastore',
                      'google-cloud-resource-manager',
                      'google-api-python-client',
                      'webapp2', 'webapp2_static', 'webob', 'pyyaml',
                      'oauth2client==3.0.0']
)
