# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os


def get_env_var(var_name):
  """Retrieves the value of an environment variable.

  Args:
    var_name: The name of the environment variable.

  Returns:
    The value of the environment variable, or None if it is not set.

  Raises:
    ValueError: If the environment variable is not set.
  """
  try:
    value = os.environ[var_name]
    return value
  except KeyError:
    raise ValueError(f'Missing environment variable: {var_name}')