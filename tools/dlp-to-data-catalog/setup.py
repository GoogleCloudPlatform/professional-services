# Copyright 2023 Google LLC. This software is provided as-is, without warranty
# or representation for any use or purpose. Your use of it is subject to your
# agreement with Google.
"""Configuration for installing the dlp-to-data-catalog-asset package."""

from setuptools import find_packages
from setuptools import setup

setup(
    name='dlp-to-data-catalog-asset',
    version='0.0.1',
    packages=find_packages(),
    py_modules=['dlp.preprocess', 'dlp.catalog', 'dlp.inspection'],
    install_requires=[
        'google-cloud-bigquery >=3.6',
        'google-cloud-dlp >=3.12',
        'google-cloud-datacatalog >=3.11',
        'apache-beam',
        'Pylint>=2.17.2',
        'google-api-core>=1.31.0',
        'cloud-sql-python-connector>=1.2.2',
        'cloud-sql-python-connector[pg8000]',
        'cloud-sql-python-connector[pymysql]',
        'SQLAlchemy>=2.0.11',
    ],
    url='N/A',
    author='N/A',
    author_email='N/A',
)
