#!/usr/bin/env python3
# Copyright 2020 Google LLC
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


class STATUS():
    DONE = 'done'
    RUNNING = 'running'
    WAITING = 'waiting'
    PAUSED = 'paused'
    ERROR = 'error'


KNOWN_STATUSES = frozenset([
    STATUS.DONE,
    STATUS.RUNNING,
    STATUS.WAITING,
    STATUS.PAUSED,
    STATUS.ERROR
])


def sts_operation_status_to_table_status(s: str):
    switch = {
        'IN_PROGRESS': STATUS.RUNNING,
        'PAUSED': STATUS.PAUSED,
        'SUCCESS': STATUS.DONE,
        'FAILED': STATUS.ERROR,
        'ABORTED': STATUS.WAITING
    }

    status = switch.get(s.upper())

    if not status:
        raise Exception('Unknown status', s)

    return status
