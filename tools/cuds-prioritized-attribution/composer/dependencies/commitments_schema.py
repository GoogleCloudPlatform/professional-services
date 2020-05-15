# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


schema = [{'type': 'STRING',
           'name': 'id',
           'mode': 'REQUIRED'},
          {'type': 'STRING',
           'name': 'folder_ids',
           'mode': 'NULLABLE'},
          {'type': 'STRING',
           'name': 'project_ids',
           'mode': 'NULLABLE'},
          {'type': 'STRING',
           'name': 'commitments_unit_type',
           'mode': 'REQUIRED'},
          {'type': 'STRING',
           'name': 'commitments_cud_type',
           'mode': 'REQUIRED'},
          {'type': 'NUMERIC',
           'name': 'commitments_amount',
           'mode': 'REQUIRED'},
          {'type': 'STRING',
           'name': 'commitments_region',
           'mode': 'REQUIRED'},
          {'type': 'DATE',
           'name': 'commit_start_date',
           'mode': 'REQUIRED'},
          {'type': 'DATE',
           'name': 'commit_end_date',
           'mode': 'REQUIRED'}]
