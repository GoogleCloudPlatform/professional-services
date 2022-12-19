#!/bin/bash
# usage: watch.sh <your_command> <sleep_duration>
url="http://localhost:8888"
duration=10

if [ ! -z "$1" ]
then
  url="$1"
fi

if [ ! -z "$2" ]
then
  duration="$2"
fi

echo "curl $url at $duration seconds interval"

timestamp() {
  date +"%T" # current time
}

while :;
  do

  echo "**** $(timestamp)  ****"
  curl "$url"
  sleep "$duration"
done

