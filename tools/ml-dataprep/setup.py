from setuptools import find_packages
from setuptools import setup

REQUIRED_PACKAGES = ['google-cloud-bigquery>=1.9.0']

setup(
    name='ml_dataprep',
    version='1.0',
    description='Machine Learning training and validation datasets generator',
    author='Dan Anghel, Barbara Fusinska',
    url='https://github.com/GoogleCloudPlatform/professional-services/tree/master/tools',
    install_requires=REQUIRED_PACKAGES,
    packages=find_packages(),
    include_package_data=True
)