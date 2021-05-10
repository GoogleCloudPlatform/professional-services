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
from recurrent.event_parser import RecurringEvent
from dateutil import rrule


class InvalidDatetimeException(Exception):
    pass


class InvalidRecurringDateException(Exception):
    pass


def strftime(timestamp_string, strftime_format):
    dt = datetime.now()
    if timestamp_string and timestamp_string != '':
        if isinstance(timestamp_string, int):  # Unix time
            dt = datetime.utcfromtimestamp(timestamp_string)
        else:
            parsed = parsedatetime.Calendar().parse(timestamp_string)
            if len(parsed) > 1:
                dt = datetime.fromtimestamp(mktime(parsed[0]))
            else:
                dt = datetime.fromtimestamp(mktime(parsed))

    return dt.strftime(strftime_format)


def recurring_date(event, now_date=None, strftime_format='%Y-%m-%d'):
    if now_date != None:
        time_struct, parse_status = parsedatetime.Calendar().parse(now_date)
        if not parse_status:
            raise InvalidDatetimeException('Failed to parse "%s"' % (now_date))
        now_date = datetime(*time_struct[:6])
    else:
        now_date = datetime.today()

    actually_now = datetime.strptime(datetime.today().strftime(strftime_format),
                                     strftime_format)
    r = RecurringEvent(now_date=now_date)
    if not r.parse(event):
        raise InvalidRecurringDateException('Invalid recurring date "%s"' %
                                            (event))

    rr = rrule.rrulestr(r.get_RFC_rrule())
    res = rr.after(actually_now, inc=True)
    return res.strftime(strftime_format)
