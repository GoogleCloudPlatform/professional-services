#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright 2020 Google Inc. All Rights Reserved.
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
import os
import flask
import time
import random
import logging

log = logging.getLogger(__name__)

app = flask.Flask(__name__)
delay = int(os.environ.get("delay", 0))

# "1 out of <err_rate>" is an error (0 = no errors)
err_rate = int(os.environ.get("err_rate", 0))
response = str(os.environ.get("response", "PONG"))


log.info("using [%s] delay" % delay)
log.info("using [%s] error_rate" % err_rate)
log.info("using [%s] response" % response)

@app.route("/ping")
def ping():
  if err_rate > 0:
    is_err = (random.random()*err_rate) < 1
    if is_err:
      return "ERROR", 500
  
  time.sleep(delay)
  return response


if __name__ == "__main__":
  app.run(host="0.0.0.0", port="8080", debug=True)
