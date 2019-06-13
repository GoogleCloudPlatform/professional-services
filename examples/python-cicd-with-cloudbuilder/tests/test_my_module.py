"""
   Copyright 2019 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

"""
from my_module import *
import pytest


class TestAdd(object):
  def test_add_basic(selfs):
    assert add(1,2) == 3

  def test_add_zero(selfs):
    assert add(0,3) == 3

  def test_add_negative(selfs):
    assert add(1,-2) == -1


class TestSquare(object):
  def test_square_positive(self):
    assert square(2) == 4

  def test_square_zero(self):
    assert square(0) == 0

  def test_square_negative(self):
    assert square(-1) == 1

class TestLogTransform(object):
  def test_log_transform_10(self):
    assert my_module.log_transform(10) == pytest.approx(2.397, 0.001)

