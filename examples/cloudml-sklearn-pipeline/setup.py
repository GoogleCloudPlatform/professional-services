#!/usr/bin/env python

# Copyright 2019 Google LLC
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

"""Scikit-learn trainer package setup."""

import setuptools

REQUIRED_PACKAGES = [
    'matplotlib>=2.2.3',
    'seaborn>=0.9.0',
    'scikit-learn>=0.20.2',
    'pandas-gbq>=0.8.0',
    'cloudml-hypertune',
    'scikit-plot',
    'tensorflow',
    'google-api-python-client'
]

setuptools.setup(
    name='custom_scikit_learn',
    author='Shixin Luo',
    version='v1',
    install_requires=REQUIRED_PACKAGES,
    packages=setuptools.find_packages(),
    include_package_data=True,
    scripts=['predictor.py'],
    description='',
)
