#  Copyright 2019 Google LLC
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
"""
This module contains example unit tests for the tutorial.

Note: These tests will be automatically found and run by pytest because the file name begins with test_ so be careful
with renaming it.
"""


from my_module import *
import pytest


class TestAdd(object):
  """This class bundles the tests for the add function in my_module"""


  def test_add_basic(self):
    assert add(1, 2) == 3

  def test_add_zero(self):
    assert add(0, 3) == 3

  def test_add_negative(self):
    assert add(1, -2) == -1


class TestSquare(object):
  """This class bundles the tests for the square function in my_module"""


  def test_square_positive(self):
    assert square(2) == 4

  def test_square_zero(self):
    assert square(0) == 0

  def test_square_negative(self):
    assert square(-1) == 1


class TestLogTransform(object):
  """This class bundles the tests for the log_transform function in my_module"""


  def test_log_transform_10(self):
    """Test without const argument supplied.

    Log_transform() can be called without const, defaulting the const to 1. This test verifies default operation.
    """
    assert my_module.log_transform(10) == pytest.approx(2.397, 0.001)


  def test_log_transform_10_const(self):
    """Test with const argument supplied.

    Log_transform() takes a positional argument 'const' that defaults to 1 and can be overridden by the user. This test
    makes sure const is implemented correctly.
    """
    assert my_module.log_transform(10, const=.001) == pytest.approx(2.303, 0.001)

  def test_log_transform_negative_const(self):
    """Test without const argument supplied.

    Log_transform() takes a positional argument 'const' that defaults to 1 and can be overridden by the user. If const
    is less than 0 it should raise a ValueException
    """
    with pytest.raises(ValueError):
      assert my_module.log_transform(10, const=-1)
