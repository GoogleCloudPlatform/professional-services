import logging

from escape_quotes_package.escape_quotes import create_pipeline

if __name__ == '__main__':
  logging.getLogger().setLevel(logging.INFO)
  create_pipeline()