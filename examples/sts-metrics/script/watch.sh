#!/bin/bash
# usage: watch.sh <your_command> <sleep_duration>
url="http://localhost:8888"
duration=10

if [ ! -z "$1" ]
then
  echo $1
  url="$1"
fi

if [ ! -z "$2" ]
then
  echo $2
  duration="$2"
fi

timestamp() {
  date +"%T" # current time
}

echo $url
echo $duration
while :;
  do
  echo "**** `timestamp`  ****"
  curl $url
  sleep $duration
done

