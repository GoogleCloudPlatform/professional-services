# Copyright 2019 Google Inc.
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
"""Provides utility functions to other modules."""

import logging
import subprocess

logger = logging.getLogger('Hive2BigQuery')


def calculate_time(start, end):
    """Pretty prints the time taken for an operation.

    Args:
        start (float): Start time of an operation.
        end (float): End time of an operation.

    Returns:
        str: Pretty format the time taken for an operation.
    """

    time_taken = int(round((end - start), 0))
    day = time_taken // 86400
    hour = (time_taken - (day * 86400)) // 3600
    minutes = (time_taken - ((day * 86400) + (hour * 3600))) // 60
    seconds = time_taken - ((day * 86400) + (hour * 3600) + (minutes * 60))

    if day != 0:
        output = '{} days {} hours {} min {} sec'.format(
            day, hour, minutes, seconds)
    elif hour != 0:
        output = '{} hours {} min {} sec'.format(hour, minutes, seconds)
    elif minutes != 0:
        output = '{} min {} sec'.format(minutes, seconds)
    else:
        output = '{} sec'.format(seconds)

    return output


def execute_command(cmd):
    """Executes system command using subprocess module and logs the stdout
    and stderr.

    Args:
        cmd (List): Command to execute, split into a list.
    """

    process = subprocess.Popen(cmd,
                               stdout=subprocess.PIPE,
                               stderr=subprocess.STDOUT)
    while process.poll() is None:
        while True:
            output = process.stdout.readline().decode()
            if output:
                logger.debug(output)
            else:
                break
