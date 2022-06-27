#!/bin/bash
#   Copyright 2022 Google LLC
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
#
wait_for_export() {
          >&2 echo "Running: $*"
          status_txt=$("$@" 2>&1)
          >&2 echo "Output: $status_txt"
          status_cmd=$(echo "$status_txt" | grep 'Use \[' | sed 's/.*\[\(.*\)\].*/\1/')
          if [ "x$status_cmd" == "x" ] ; then
            exit 0
          fi
          >&2 echo "Status command: $status_cmd"
          while [ "$status" != "True" ]
          do
              sleep 2
              status=$($status_cmd --format='value(done)')
              if [ "x$status" == "x" ] ; then
                >&2 echo -n "." 
              else
                >&2 echo " [$status]"
              fi
          done
}

wait_for_export "$@"
