from setuptools import setup, find_packages

setup(
    name='python-package-example',
    version='0.1',
    packages=find_packages(exclude=['tests*']),
    license='MIT',
    description='An example python package',
    long_description='README.md content',
    install_requires=['numpy'],
    url='https://github.com/BillMills/python-package-example',
    author='Bill Mills',
    author_email='myemail@example.com'
)
