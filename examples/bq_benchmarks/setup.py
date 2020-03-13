import setuptools
setuptools.setup(name='load_benchmark_tools',
                 packages=setuptools.find_packages(),
                 install_requires=[
                     'apache-beam[gcp]>=2.10.0', 'avro>=1.8.2',
                     'google-api-core>=1.7.0', 'google-cloud>=0.34.0',
                     'google-cloud-bigquery>=1.18.0',
                     'google-cloud-core>=0.29.1',
                     'google-cloud-storage>=1.14.0',
                     'googleapis-common-protos>=1.5.8', 'pyarrow>=0.11.1'
                 ])
