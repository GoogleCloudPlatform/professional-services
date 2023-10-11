# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from src.utils import get_logger
from urllib.parse import quote_plus

LOGGER = get_logger('looker-studio-service')

class LookerStudioService(object):
  """
  Looker Studio Service for dynamically generating LookerStudio Dashboard
  This uses lookerStudio Linking APi for generating reports using a template report accessible to all
  """

  def __init__(self,
      template_report_id = None,
      new_report_name = None,
      datasources_config: dict[str,str] = None):

    self.template_report_id = template_report_id
    self.new_report_name = new_report_name
    self.datasources_config = datasources_config


  def get_copy_report_url(self):
    """
    Creates a linking API url based on input params
    https://developers.google.com/looker-studio/integrate/linking-api
    :return Linking API URL
    """
    return f"https://lookerstudio.google.com/reporting/create?c.reportId={quote_plus(self.template_report_id)}" + \
           f"&r.reportName={quote_plus(self.new_report_name)}&" + \
           '&'.join(f"{quote_plus(key)}={quote_plus(value)}" for key, value in self.datasources_config.items())