# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from datetime import datetime
import logging
import sys
import codecs
import os

def make_directories(filename):
  if not os.path.exists(os.path.dirname(filename)):
    os.makedirs(os.path.dirname(filename))

def get_logger(name, fmt=None, loglevel="info"):
  """
  Creates a Logger that logs to stdout
  :param name: name of the logger
  :param fmt: format string for log messages
  :return: Logger
  """
  if fmt:
    LOG_FORMAT = fmt
  else:
    LOG_FORMAT = '%(asctime)-15s %(name)s %(levelname)s %(message)s'

  EXECUTION_TIME=datetime.now().strftime("%Y%m%d_%H%M%S")
  LOG_DIR = os.path.join(os.path.dirname(__file__), os.pardir, 'logs')
  LOG_FILE = f"{LOG_DIR}{os.sep}airflow_{EXECUTION_TIME}.log"

  make_directories(LOG_FILE)
  LOG_LEVEL = {
      "INFO": logging.INFO,
      "DEBUG": logging.DEBUG,
      "WARN": logging.WARN,
      "ERROR": logging.ERROR
  }
  logging.basicConfig(
      level=LOG_LEVEL.get(loglevel.upper()) or LOG_LEVEL.get("INFO"),
      format=LOG_FORMAT,
      handlers=[
          logging.FileHandler(LOG_FILE),
          logging.StreamHandler(sys.stdout)
      ]
  )

  return logging.getLogger(name)


def read_file(path):
  """
  Reads UTF-8 encoded SQL from a file
  :param path: path to SQL file
  :return: str contents of file
  """
  with codecs.open(path, mode='r', encoding='utf-8', buffering=-1) as file:
    return file.read()


def store_file(path, content):
  """
  Reads UTF-8 encoded SQL from a file
  :param path: path to SQL file
  :return: str contents of file
  """
  make_directories(path)
  open(path, mode='w', encoding='utf-8', buffering=-1).write(content)

