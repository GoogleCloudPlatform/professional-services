# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import io
import os

import setuptools

# Package metadata.

name = "cdap"
description = "CDAP REST API client library"
version = "0.1"
# Should be one of:
# 'Development Status :: 3 - Alpha'
# 'Development Status :: 4 - Beta'
# 'Development Status :: 5 - Production/Stable'
release_status = "Development Status :: 3 - Alpha"
dependencies = [
    "google-auth >= 1.9.0, < 2.0dev",
    "google-api-core >= 1.15.0, < 2.0dev",
]

# Setup boilerplate below this line.

package_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

readme_filename = os.path.join(package_root, "README.md")
try:
    with io.open(readme_filename, encoding="utf-8") as readme_file:
        readme = readme_file.read()
except FileNotFoundError:
    readme = """# CDAP Lineage Export to Google Cloud Storage

This is a simple application to export the Dataset lineage info in the
[CDAP Lineage API](https://docs.cdap.io/cdap/current/en/reference-manual/http-restful-api/metadata.html#H2481).
"""

# Only include packages under the 'cdap' namespace. Do not include tests,
# benchmarks, etc.
packages = [
    package for package in setuptools.find_packages()
    if package.startswith("cdap")
]

setuptools.setup(
    name=name,
    version=version,
    description=description,
    long_description=readme,
    long_description_content_type="text/markdown",
    author="Google LLC",
    author_email="professional-services-oss@google.com",
    license="Apache 2.0",
    url=
    "https://github.com/GoogleCloudPlatform/professional-services/blob/master/tools/cdf-lineage-exporter/README.md",
    classifiers=[
        release_status,
        "Intended Audience :: Developers",
        "License :: OSI Approved :: Apache Software License",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Operating System :: OS Independent",
        "Topic :: Internet",
    ],
    platforms="Posix; MacOS X; Windows",
    packages=packages,
    install_requires=dependencies,
    # Python 3.6 is needed for use of f-strings.
    python_requires=">=3.6",
    include_package_data=True,
    zip_safe=False,
)
