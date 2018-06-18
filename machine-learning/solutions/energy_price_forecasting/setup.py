"""Sets up the worker nodes.

  Defines needed Python packages as well as the name and version of the setup.
"""

from setuptools import find_packages
from setuptools import setup

# Include any python packages you need to be installed to this list.
REQUIRED_PACKAGES = []

setup(
    name='energy_forecaster',
    version='1.0',
    install_requires=REQUIRED_PACKAGES,
    packages=find_packages(),
    description='This model forecasts hourly energy prices.'
)
