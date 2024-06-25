#!/bin/bash

set -e

echo "START: Running compodoc on `date`"

echo echo "compodoc args=$@"

compodoc $@

echo "END: Running compodoc on `date`"