# Copyright 2020 Google Inc.
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

from datetime import timezone

import apache_beam as beam


def get_formatted_time(timestamp: beam.utils.timestamp.Timestamp,
                       datetime_format: str = "%Y-%m-%d  %H:%M:%S",
                       time_zone: str = "local") -> str:
    """
     Args:
        timestamp: Seconds since epoch
        datetime_format: Date Time format
        time_zone: Time zone value either local/utc

     Returns:
         Formatted datetime in local/utc time zone
     """
    utc_dt = timestamp.to_utc_datetime()
    if time_zone == "local":
        return utc_dt.replace(tzinfo=timezone.utc).astimezone(
            tz=None).strftime(datetime_format)

    return utc_dt.strftime(datetime_format)
