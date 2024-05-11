#!/bin/bash

set -e

echo "START: Running sonar-scanner-cli on `date`"

sed -i 's/use_embedded_jre=true/use_embedded_jre=false/g' $SONARQUBE_SCANNER_BIN/sonar-scanner

sonar-scanner $@
echo "END: Running sonar-scanner-cli on `date`"