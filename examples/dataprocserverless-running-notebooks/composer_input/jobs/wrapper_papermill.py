r"""Wrapper script for executing notebooks using Dataproc jobs API.

Usage: `gcloud dataproc jobs submit pyspark --cluster $CLUSTER_NAME wrapper.py \
        -- gs://$INPUT_LOCATION gs://$OUTPUT_LOCATION` \
        --parameters-file=gs://$PARAM_YAML_LOCATION \
        --parameters='foo: bar'

Only tested with Dataproc version 2.0+ images
"""

import argparse
import re
from google.cloud.storage.client import Client
import papermill as pm
import yaml
import sys

def main():
  parser = argparse.ArgumentParser()

  parser.add_argument(
      'input',
      metavar='input',
      type=str,
      help='GCS URI location of the input notebook')
  parser.add_argument(
      'output',
      metavar='output',
      type=str,
      help='GCS URI location of the output executed notebook')
  parser.add_argument(
      '--parameters-file',
      metavar='parameters_file',
      help='GCS URI location of yaml file defining parameters values.')
  parser.add_argument(
      '--parameters',
      metavar='parameters',
      help='YAML string defining parameter values.')
  parser.add_argument(
      '--kernel-name',
      metavar='kernel_name',
      help='Name of the kernel spec to use. This must be specified if the '
      'kernel spec name on the cluster does not match the name in the input '
      'notebook file.')
  args = parser.parse_args()

  # Download input notebook and params file from GCS
  # Note that papermill supports gcsfs by default, but some type of dependency
  # problem appears to prevent this from working out of the box on 2.0 images
  gcs = Client()

  params = {}
  if args.parameters_file:
    print('Reading parameter yaml from "%s"' % args.parameters_file)
    with open('parameters.yaml', 'wb+') as f:
      gcs.download_blob_to_file(args.parameters_file, f)
      f.seek(0)
      params = yaml.safe_load(f)

  if args.parameters:
    params.update(yaml.safe_load(args.parameters))
  print('Found parameters %s' % params)

  print('Reading notebook from "%s"' % args.input)
  with open('input.ipynb', 'wb') as f:
    gcs.download_blob_to_file(args.input, f)

  kwargs = {}
  if args.kernel_name:
    kwargs['kernel_name'] = args.kernel_name
  pm.execute_notebook(
      'input.ipynb', 'output.ipynb', kernel_name='python3',log_output=True, progress_bar=False, stdout_file=sys.stdout, parameters=params, **kwargs)

  # Annoyingly, the GCS client libraries don't seem to expose a helper function
  # to extract the bucket directly, so do this by hand
  matched = re.match('gs://([^/]+)/(.+)', args.output)
  # if not matched:
  #   raise ValueError('Invalid output URI: "%s"' % args.output)
  print('Writing result to "%s"' % args.output)
  bucket = gcs.get_bucket(matched.group(1))
  blob = bucket.blob(matched.group(2))
  blob.upload_from_filename('output.ipynb')


if __name__ == '__main__':
  main()