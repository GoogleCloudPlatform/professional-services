import setuptools

REQUIRED_PACKAGES = ['apache-beam[gcp]',
                     'textdistance'
                     ]

PACKAGE_NAME = 'dataflow-production-ready-python'
PACKAGE_VERSION = '0.0.1'

setuptools.setup(
  name=PACKAGE_NAME,
  version=PACKAGE_VERSION,
  install_requires=REQUIRED_PACKAGES,
  packages=setuptools.find_packages()
)