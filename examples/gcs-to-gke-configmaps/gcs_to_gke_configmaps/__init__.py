# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import functools
import logging
import sys

import google.auth
import google.auth.transport.requests

cloud_logger = logging.getLogger("cloudLogger")


class InfoFilter(logging.Filter):
    def filter(self, rec):
        return rec.levelno in (logging.DEBUG, logging.INFO)


def setup_logging():

    cloud_logger.propagate = False

    cloud_logger.setLevel(logging.DEBUG)

    # std_handler = logging.StreamHandler(sys.stdout)
    std_handler = logging.StreamHandler(sys.stdout)
    std_handler.setLevel(logging.DEBUG)
    std_handler.addFilter(InfoFilter())

    err_handler = logging.StreamHandler()
    err_handler.setLevel(logging.WARN)

    cloud_logger.addHandler(std_handler)
    cloud_logger.addHandler(err_handler)


def logged(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        func_name = func.__name__
        cloud_logger.debug(
            "started '{0}' with args '{1}' and kwargs '{2}'".format(
                func_name, args, kwargs))
        result = func(*args, **kwargs)
        cloud_logger.debug("finished '{0}'".format(func_name))
        return result

    return wrapper


def get_credentials():
    credentials, _ = google.auth.default()
    request = google.auth.transport.requests.Request()
    credentials.refresh(request)
    return credentials


def get_token():
    return get_credentials().token
