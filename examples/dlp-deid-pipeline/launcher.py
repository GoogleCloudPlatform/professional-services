#  Copyright 2024 Google LLC. This software is provided as-is, without warranty
#  or representation for any use or purpose. Your use of it is subject to your
#  agreement with Google.

"""This file is used by Dataflow template to launch the pipeline."""

import logging

from src import run

if __name__ == '__main__':
  logging.getLogger().setLevel(logging.INFO)
  run.main()
