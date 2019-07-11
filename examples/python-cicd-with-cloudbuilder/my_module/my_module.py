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
Sample module used to demonstrate CI with:
 - Pytest
 - Cloud Source Repositories
 - Cloud Builder

Tutorial found in README.md.
"""

import numpy as np

def is_numeric(x):
  return True if type(x) in [int, float] else False


def add(a, b):
  """Adds two numbers, a and b.

  Args:
    a: A numeric variable.
    b: A numeric variable.

  Returns:
    A numeric variable that is the sum of a and b.
  """
  for var in [a,b]:
    if not is_numeric(var):
      raise TypeError("Inputs a and b must be an int or float, "
                       "but {} was passed".format(var))
  return a + b


def square(x):
  """Returns the square of x.

  Args:
    x: A numeric variable.

  Returns:
    The square of x.
  """

  if not is_numeric(x):
    raise TypeError("Input x must be an int or float, "
                     "but {} was passed".format(x))

  return x ** 2


def log_transform(x, const=1):
  """Log Transforms x.

  Returns the natural log transform of x, to reduce the skewedness for some
  distribution X.

  For more on why/when to use a log transformation,
  read here: http://onlinestatbook.com/2/transformations/log.html.

  Args:
    x: A numeric variable to transform.
    const: A constant to add to x to prevent taking the log of 0.

  Returns:
    log (x + const).

  Raises:
    ValueError: Raises a value error if const <= 0.
  """
  if const <= 0:
    raise ArithmeticError("Constant const must be greater than 0, not {}"
                     .format(const))

  if not is_numeric(x):
    raise TypeError("Input x must be an int or float, "
                     "but {} was passed".format(x))

  return np.log(x + const)


def main():  # pragma: no cover
  """Driver loop for the example code under test"""
  a = 5
  b = 10
  total = add(a, b)
  print("The sum of {} and {} is {}.".format(a, b, total))
  print("The square of {} is {}.".format(3, square(3)))
  print("The ln of 10 is {}.".format(log_transform(10)))

if __name__ == "__main__":  # pragma: no cover
  main()
