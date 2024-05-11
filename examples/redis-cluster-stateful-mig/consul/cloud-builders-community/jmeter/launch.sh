#!/bin/bash

set -e

echo "START: Running Jmeter on `date`"
echo "jmeter args=$@"

jmeter $@
echo "END: Running Jmeter on `date`"