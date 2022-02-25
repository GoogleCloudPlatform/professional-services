# Copyright 2022 Google LLC
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
"""
setup.py file
"""
from setuptools import setup
setup(
   name='xsd2bq',
   version='1.0',
   description='A useful module',
   author='Ayman Farhat',
   author_email='aymanf@google.com',
   packages=['xsd2bq'],
   install_requires=['xmlschema==1.9.2'],
   entry_points={
       'console_scripts': ['xsd2bq=xsd2bq.__main__:main']
       },
   python_requires='>=3.6'
)
