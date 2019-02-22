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

import cloudstorage as gcs
import pandas as pd
from datetime import datetime

def load_main_energy_data(project_id, gs_path):
  """Load main energy data from the specified file.

  Load main energy data from the specified file.

  Args:
    project_id: string, GCP project id.
    gs_path: string, path to the data file.
  Returns:
    pd.DataFrame, main energy data.
  """
  with gcs.open(gs_path) as f:
    data = pd.read_csv(f,
                       delimiter=' ',
                       header=None,
                       names=['time',
                              'main_watts',
                              'main_va',
                              'main_RMS'])
  data.time = data.time.apply(lambda x: datetime.fromtimestamp(x))
  data.set_index('time', drop=True, inplace=True)
  data.index = data.index.floor('S')
  return data

