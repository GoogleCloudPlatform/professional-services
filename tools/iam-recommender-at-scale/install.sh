#!/bin/bash
echo "---------------Installing iam-recommender-at-scale---------------"
BASEDIR=$HOME/iam-recommender-at-scale
TEMPDIR=/tmp/professional-service

rm -rf "$BASEDIR"
rm -rf $TEMPDIR

mkdir "$BASEDIR"
wget -P $TEMPDIR https://github.com/misabhishek/professional-services/archive/master.zip
unzip $TEMPDIR/master.zip 'professional-services-master/tools/iam-recommender-at-scale/*' -d $TEMPDIR
mv $TEMPDIR/professional-services-master/tools/iam-recommender-at-scale/* "$BASEDIR"
rm -rf $TEMPDIR

cd "$BASEDIR"/ || exit

virtualenv -p python3 env

# shellcheck disable=SC1091
source env/bin/activate
pip install -r requirement.txt
