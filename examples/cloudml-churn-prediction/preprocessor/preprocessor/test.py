#!/usr/bin/env python

# Copyright 2019 Google Inc. All Rights Reserved.
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

from datetime import datetime, timedelta
import random

def random_date(start, end):
  delta = end - start
  int_delta = delta.days
  print(type(int_delta))
  random_day = random.randrange(int_delta)
  return start + timedelta(days=random_day)



if __name__ == '__main__':
  d1 = datetime.strptime('1/1/2008', '%m/%d/%Y')
  d2 = datetime.strptime('1/1/2009', '%m/%d/%Y')
  print(random_date(d1, d2))