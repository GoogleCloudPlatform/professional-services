#!/bin/bash
grep "$(yum updateinfo list security installed | awk '{ print $3 }')" <(rpm -qa --last) > patch_date.csv