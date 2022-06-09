#!/bin/bash
# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# 	http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
#
# Precommit Hook for K8s Manifest Validation pre-CI/CD pipeline.
# Janine Bariuan and Thomas Desrosiers
# Using: kpt, kustomize, gator cli

#########################################################
####### STEP 0 - DEPENDENCY INSTALLATION PRE-WORK #######
#########################################################

# Unset CDPATH to restore default cd behavior. An exported CDPATH can
# cause cd to output the current directory to STDOUT.
unset CDPATH

# Send errors to STDERR
err() {
  echo "[$(date +'%Y-%m-%dT%H:%M:%S%z')]: $*" >&2
}

#Define location of dependencies, consistent across files
readonly INSTALL_DIR=".oss_dependencies"

#######################################
# Emulates `readlink -f` behavior, as this is not available by default on MacOS.
# Helps rationalize symlinks or canonical files to the path it represents.
#   See: https://stackoverflow.com/questions/1055671/how-can-i-get-the-behavior-of-gnus-readlink-f-on-a-mac
# Arguments:
#   TARGET_FILE ($1)
# Outputs:
#   Writes full path to stdout
#######################################
function readlink_f {
    TARGET_FILE=$1

    cd "$(dirname "$TARGET_FILE")" || exit
    TARGET_FILE=$(basename "$TARGET_FILE")

    # Iterate down a (possible) chain of symlinks
    while [ -L "$TARGET_FILE" ]
    do
        TARGET_FILE=$(readlink "$TARGET_FILE")
        cd "$(dirname "$TARGET_FILE")" || exit
        TARGET_FILE=$(readlink "$TARGET_FILE")
    done

    # Compute the canonicalized name by finding the physical path
    # for the directory we're in and appending the target file.
    PHYS_DIR=$(pwd -P)
    RESULT=$PHYS_DIR/$TARGET_FILE
    echo "$RESULT"
}

# Prompt user if they really want to continue with the deletion
echo "* This script will delete Pre-Validate Dependencies and remove .git/hooks/pre-commit.sh."
read -r -p "Are you sure you want to continue? [y/N] " response
if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    exit 0
fi

#############################################
###### STEP 1 - Remove Pre-Commit Hook ######
#############################################

# Determine if user has run this code from the correct directory
where="$(readlink_f "$(printf "%q\\n" "$(PWD)")")/"
if [[ ! -f $where/.git/hooks/pre-commit  ]]; then
    err "It seems this code is either not being run in a git repository, or being run in the wrong place and can't access your pre-commit hook. Please Make sure you run this command in your project root."
    exit 1
fi

# Delete Pre-Commit Hook
rm "$where"/.git/hooks/pre-commit

#############################################################
###### STEP 2 - Delete Necessary Files and Directories ######
#############################################################

# Delete Dependencies (Folder marked by $INSTALL_DIR)
rm -rf $INSTALL_DIR

# Delete User Configuration (.pre-validate-config)
rm -rf .pre-validate-config

# Delete Hydrated Manifests (Generated in validate.sh, storing Kuztomized files in .hydrated-manifests)
rm -rf .hydrated-manifests

###############################################
###### STEP 2 - Remove Remaining Scripts ######
###############################################

rm -f validate.sh
rm -f setup.sh
rm -f cleanup.sh

#############################################
########### STEP 3 - Finish and UX ##########
#############################################

# Finish
echo "Pre-Validate has been removed. Thank you for trying it out!"
echo "Visit https://github.com/~~~~~~~~OUR REPO~~~~~~~ for more information."