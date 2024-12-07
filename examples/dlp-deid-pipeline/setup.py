#  Copyright 2024 Google LLC. This software is provided as-is, without warranty
#  or representation for any use or purpose. Your use of it is subject to your
#  agreement with Google.

"""Setup config for Dataflow pipelines."""

from setuptools import find_packages
from setuptools import setup

REQUIRED_PACKAGES = [
	"apache-beam[gcp]==2.60.0",
	"PyYAML==6.0.2"
]

setup(
	name="deid-pipeline",
	version="0.1",
	packages=find_packages(),
	include_package_data=True,
	install_requires=REQUIRED_PACKAGES,
	description="De-identification Pipeline",
)
