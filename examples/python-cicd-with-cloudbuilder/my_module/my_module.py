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

Sample module used to demonstrate CI with:
 - Pytest
 - Cloud Source Repositories
 - Cloud Builder

Tutorial found in README.md



"""
import numpy as np


def add(a, b):
  """
  Adds two numbers, a and b
  :param a  First number to add
  :param b  Second number to add
  :return: The sum of a and b
  """
  return a + b


def square(x):
  """
  returns the square of x
  :param x: number to square
  :return: x ** 2
  """
  return x ** 2


def log_transform(x, const=1):
  """
  returns the log of x to reduce skewedness in our dataset
  :param x: value or values to transform
  :param const: a constant to add to x to prevent taking the log of 0
  :return: log of x + 1
  """
  assert const > 0
  return np.log(x + const)


def main():  # pragma: no cover
  """
  Driver loop that runs these functions
  :return:
  """
  a = 5
  b = 10
  total = add(a, b)
  print("The sum of {} and {} is {}".format(a, b, total))
  print("The ln of 10 is {}".format(log_transform(10)))


if __name__ == "__main__":  # pragma: no cover
  main()
