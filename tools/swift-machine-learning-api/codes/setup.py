'''Set up file for the cloud environment'''

from setuptools import find_packages
from setuptools import setup


REQUIRED_PACKAGES = ['google-cloud-storage==1.14.0',
                     'tensorflow==1.12.0', 'dask[complete]==1.0.0', 'dill==0.2.8.2', 'lime==0.1.1.32']

setup(
    name='trainer',
    version='0.0',
    install_requires=REQUIRED_PACKAGES,
    packages=find_packages(),
    include_package_data=True,
    description='CMLA package'
)
