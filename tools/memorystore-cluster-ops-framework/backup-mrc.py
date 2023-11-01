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



from mrc_framework import redisCluster, write_log
import argparse

def parseArgs():
    """
    Parse the command-line arguments.

    Returns:
        dict: The dictionary of command-line arguments.
    """
    parser = argparse.ArgumentParser(description="Run riot command and export file to GCS")
    parser.add_argument("-i", "--hostip", help="Redis host", required=True)
    parser.add_argument("-p", "--port", help="Redis port", required=True)
    parser.add_argument("-c", "--clustername", help="Cluster name", required=True)
    parser.add_argument("-pass", "--password", default="",help="Password ", required=False)
    parser.add_argument("-b", "--bucket", help="GCS bucket name", required=True)
    parser.add_argument("-t", "--file_type", default="json", help="File type", required=False)

    args = parser.parse_args()
    if args.file_type not in ["json", "xml"]:
        raise ValueError("File type must be json or xml")
    
    return args


if __name__ == "__main__":
    
    """
    The main function.

    This function parses the command-line arguments and then runs the riot command to export the Redis cluster data to a GCS bucket.
    """

    args = parseArgs()
    cluster = redisCluster(host=args.hostip, port=args.port, password=args.password)

    write_log(f"host: {args.hostip}, port: {args.port}, cluster: {args.clustername}, bucket: {args.bucket}", target="console")
    
    cluster.backup_cluster(args.clustername, args.bucket, args.file_type)

   