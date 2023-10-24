"""This is the entry point of the s3_to_bq migration tool.

This tool is for migrating files from s3 to bq with minimal manual intervention.
"""

from sys import argv
from typing import Sequence

import app

# TODO: automate enabling all the required APIs
def main(argv: Sequence[str]) -> None:
  if len(argv) > 2:
    raise ValueError('Too many command-line arguments.')
  if len(argv) != 2:
    raise ValueError('Please provide configuration file.')
  app.run(argv[1])

if __name__ == '__main__':
  main(argv)