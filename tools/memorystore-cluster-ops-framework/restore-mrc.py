#!/usr/bin/env python
# Copyright 2023 Google Inc.
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


from mrc_framework import redisCluster
import argparse

def parseArgs():
    """
    Parse the command-line arguments.

    Returns:
        dict: The dictionary of command-line arguments.
    """
    parser = argparse.ArgumentParser(description="Restore from JSON Backup")
    parser.add_argument("-i", "--hostip", help="Redis host", required=True)
    parser.add_argument("-p", "--port", help="Redis port", required=True)
    parser.add_argument("-pass", "--password", default="",help="Password ", required=False)
    parser.add_argument("-b", "--bucket", help="GCS bucket name or local path of the backup file", required=True)
    parser.add_argument("-m", "--mode", help="append/replace", default="append", required=False)    
    args = parser.parse_args()
    
    if args.mode not in ["append", "replace"]:
        print("Mode must be append or replace")
        exit(1)

    return args


if __name__ == "__main__":
    
    """
    The main function.

    This function parses the command-line arguments and then runs the riot command to import a JSON file to a MRC cluster.
    """

    args = parseArgs()
    cluster = redisCluster(host=args.hostip, port=args.port, password=args.password)
    cluster.restore_cluster(args.bucket, mode=args.mode)
