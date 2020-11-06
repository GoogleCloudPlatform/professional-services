#!/bin/bash

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
