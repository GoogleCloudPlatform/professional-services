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
"""A setuptools based setup module.

See:
https://packaging.python.org/en/latest/distributing.html
https://github.com/pypa/sampleproject
"""

import io
import os
from setuptools import find_packages
from setuptools import setup

here = os.path.abspath(os.path.dirname(__file__))

# Get the long description from the README file
with io.open(os.path.join(here, 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

setup(name='gsuite-grant-analyzer',
      version='1.0.0',
      description='GSuite OAuth scopes analyzer',
      long_description=long_description,
      long_description_content_type='text/markdown',
      author='Google Inc.',
      author_email='tpaba@google.com',
      packages=find_packages(exclude=['contrib', 'docs', 'tests']),
      classifiers=[
          'Development Status :: 3 - Alpha',
          'Intended Audience :: Developers',
          'Topic :: Software Development :: Build Tools',
          'License :: OSI Approved :: MIT License',
          'Programming Language :: Python :: 2',
          'Programming Language :: Python :: 2.7',
          'Programming Language :: Python :: 3',
          'Programming Language :: Python :: 3.4',
          'Programming Language :: Python :: 3.5',
          'Programming Language :: Python :: 3.6',
      ],
      keywords='gsuite exporter stackdriver',
      install_requires=[
          'google-api-python-client',
          'google-cloud-bigquery',
          'oauth2',
          'retrying',
      ],
      entry_points={
          'console_scripts': [
              'gsuite-grant-analyzer=gsuite_grant_analyzer.cli:main',
          ],
      },
      python_requires='>=2.7')
