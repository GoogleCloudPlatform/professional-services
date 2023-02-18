#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright 2018 Google LLC. All rights reserved. Licensed under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed under the License
# is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
# or implied. See the License for the specific language governing permissions and limitations under
# the License.
#
# Any software provided by Google hereunder is distributed "AS IS", WITHOUT WARRANTIES OR
# CONDITIONS OF ANY KIND, and is not intended for production use.
"""Setup installation module for gcs_bucket_mover."""

from setuptools import find_packages
from setuptools import setup

long_desc = """
gcs_bucket_mover is a Python application that helps you move storage buckets between projects in Google Cloud.
"""

requires = [
    "attrs", "configargparse", "google-api-python-client",
    "google-cloud-logging", "google-cloud-pubsub", "google-cloud-storage",
    "mock", "retrying", "oauth2client", "yaspin", "Faker", "PyYAML"
]

setup(
    name="gcs_bucket_mover",
    version="1.2.0",
    license="Apache 2.0",
    author="Google Inc.",
    author_email="mgeneau@google.com",
    description=
    "A command line tool for moving storage buckets between projects in Google Cloud.",
    long_description=long_desc,
    zip_safe=True,
    classifiers=[
        "Development Status :: 1 - Planning",
        "Environment :: Console",
        "Intended Audience :: Developers",
        "Intended Audience :: System Administrators",
        "License :: OSI Approved :: Apache Software License",
        "Natural Language :: English",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Topic :: System :: Filesystems",
        "Topic :: Utilities",
    ],
    platforms="any",
    packages=find_packages(exclude=["third_party"]),
    include_package_data=True,
    install_requires=requires,
    scripts=["bin/bucket_mover"])
