#!/bin/bash

# This code is a prototype and not engineered for production use.
# Error handling is incomplete or inappropriate for usage beyond
# a development sample.

set -e

if [ $# -ne 3 ]; then
    echo "Please provide REPO_ID, PROJECT_ID and BRANCH_ID"
    exit 1
fi

REPO_ID=$1
PROJECT_ID=$2
BRANCH_ID=$3

files=(
bqc.go
job.go
main.go
main_test.go
testdata_entry.json
slack.go
go.mod
go.sum
)

TMPDIR=/tmp/temp_repo
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
OLD_DIR=${PWD}

cd /tmp

if [ -d "$TMPDIR" ]; then
    rm -r -f $TMPDIR
fi

gcloud source repos clone $REPO_ID $TMPDIR --project=$PROJECT_ID

cd $TMPDIR

for file in ${files[@]}; do
    cp $DIR/$file $TMPDIR/
done

for file in ${files[@]}; do
    git add $file
done

git commit -a -m "initial checkin"

git push

git checkout -b $BRANCH_ID

git push --set-upstream origin $BRANCH_ID

cd $OLD_DIR

rm -r -f $TMPDIR
