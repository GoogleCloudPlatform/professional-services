#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
from datetime import datetime
from time import mktime
import parsedatetime


def strftime(timestamp_string, strftime_format):
    dt = datetime.now()
    if timestamp_string and timestamp_string != '':
        parsed = parsedatetime.Calendar().parse(timestamp_string)
        if len(parsed) > 1:
            dt = datetime.fromtimestamp(mktime(parsed[0]))
        else:
            dt = datetime.fromtimestamp(mktime(parsed))

    return dt.strftime(strftime_format)
