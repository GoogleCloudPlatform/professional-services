#!/bin/bash
#
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
# Precommit Hook for K8s Manifest Validation pre-CI/CD pipeline.
# Janine Bariuan and Thomas Desrosiers

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

# Define tput sequences for bold text output to terminal
bold=$(tput bold)
normal=$(tput sgr0)

# Define a location to install dependencies
readonly INSTALL_DIR=".oss_dependencies"
readonly KUSTOMIZE_DOWNLOAD_BASE_URL="https://api.github.com/repos/kubernetes-sigs/kustomize/releases"
readonly GATORCLI_DOWNLOAD_BASE_URL="https://api.github.com/repos/open-policy-agent/gatekeeper/releases"
readonly KPT_DOWNLOAD_BASE_URL="https://api.github.com/repos/GoogleContainerTools/kpt/releases"

# Determine OS and System Architecture
opsys=windows
if [[ "$OSTYPE" == linux* ]]; then
  opsys=linux
elif [[ "$OSTYPE" == darwin* ]]; then
  opsys=darwin
fi

case $(uname -m) in
x86_64)
    arch=amd64
    ;;
arm64)
    arch=arm64
    ;;
ppc64le)
    arch=ppc64le
    ;;
s390x)
    arch=s390x
    ;;
*)
    arch=amd64
    ;;
esac

########################################################
########### STEP 1 - DEPENDENCY INSTALLATION ###########
########################################################

echo $'\nInstalling Dependencies\n'

# Create install directory and create a file to track versions/defaults
mkdir -p $PWD/$INSTALL_DIR/
cd $PWD/$INSTALL_DIR/
    # create empty config.json file if it doesn't exits already.
    # if it does exist, store value of each line in the file to a variable
touch dependency_info.txt
source dependency_info.txt &>/dev/null
system_info=$SYS_INFO
last_kpt_version=$KPT_VERSION
last_kustomize_version=$KUSTOMIZE_VERSION
last_gator_version=$GATOR_VERSION


#######################################################
################### DEFINE FUNCTIONS ##################
#######################################################

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

    cd "$(dirname "$TARGET_FILE")"
    TARGET_FILE=$(basename "$TARGET_FILE")

    # Iterate down a (possible) chain of symlinks
    while [ -L "$TARGET_FILE" ]
    do
        TARGET_FILE=$(readlink "$TARGET_FILE")
        cd "$(dirname "$TARGET_FILE")"
        TARGET_FILE=$(readlink "$TARGET_FILE")
    done

    # Compute the canonicalized name by finding the physical path
    # for the directory we're in and appending the target file.
    PHYS_DIR=$(pwd -P)
    RESULT=$PHYS_DIR/$TARGET_FILE
    echo "$RESULT"
}

#######################################
# Check if a dependency needs an update.
# If it's determined the dependency doesn't exist or is out of date, 
# it will install the latest version.
# Arguments:
#   $1 = Base URL of the Github repo
#   $2 = Name of tool (ie. kpt, gator, etc.)
#   $3 = Format of compressed file (ie. kustomize_v*_${opsys}_${arch}.tar.gz)
#   $4 = Format of download url to grep 
#        (ie. grep browser_download.*${opsys}_${arch} for Kustomize)
# Outputs:
#   Stores the new version in global variable, if changed
#######################################
function install_dependency {

    where="$(readlink_f $(printf "%q\n" "$(PWD)"))/"

    # Verify the script can rationalize the current directory into an absolute
    # path
    if ! test -d "$where"; then
        err "Could not locate your current directory, $where"
        exit 1
    fi
    if [ -d "${where}/$2" ]; then
        err "${where}/$2 exists and is a directory. Remove or rename it first."
        exit 1
    fi

    # Create temp directory to pull release history into
    tmpDir=`mktemp -d`
    if [[ ! "$tmpDir" || ! -d "$tmpDir" ]]; then
        err "Could not create temp dir."
        exit 1
    fi

    # Run installation in temp directory to enable parallel installations
    function cleanup {
    rm -rf "$tmpDir"
    }
    trap cleanup EXIT ERR
    pushd "$tmpDir" >& /dev/null

    #  Find Latest Release and pull down from repo history
    releases=$(curl -s $1)
    if [[ $releases == *"API rate limit exceeded"* ]]; then
    err $'\nGithub rate-limiter failed the request. Either authenticate or wait a couple of minutes.'
    exit 1
    fi

    # Find most up-to-date release URL and compare to what exists in 
    # dependency_info already
    # This step will determine if the latest version is already installed, or 
    # if it needs to update
    RELEASE_URL=$(echo "${releases}" |\
    grep $4 |\
    cut -d '"' -f 4 |\
    sort -V | tail -n 1)

    # Grab the latest version from dependency_info.txt
    # If dependency_info.txt shows a version, but the command doesn't exist, 
    # download it.
    # If neither the command nor the information in dependency_info.txt exist, 
    # download it.
    if [[ -f "${where}/$2" ]]; then
        if [[ "$5" == "$RELEASE_URL" ]]; then
            echo "Already have the latest version of $2"
        else
            echo "Version Change Detected. Installing $2"
            # Get latest release from github
            curl -sLO $RELEASE_URL
            # extract file and overwrite the older file if it exists in here
            tar -xvf  $3
            # delete source file when finished extracting
            rm $3
            # Bring function into depency folder
            cp ./$2 "$where"
            chmod 775 ${where}$2
            echo $'\n'
            echo "$2 installed to $where/$2"
            # Figure out which var to update in dependency_info.txt
            case $2 in
            kustomize)
                last_kustomize_version=$RELEASE_URL
                ;;
            gator)
                last_gator_version=$RELEASE_URL
                ;;
            kpt)
                last_kpt_version=$RELEASE_URL
                ;;
            *)
                err "Something's not quite right with these Versions"
                ;;
            esac
        fi
    else
        echo "Config lists version, but it is not installed. Installing $2"
        # Get latest release from github
        curl -sLO $RELEASE_URL
        # extract file and overwrite the older file if it exists in here
        tar -xvf  $3
        # delete source file when finished extracting
        rm $3
        # Bring function into depency folder
        cp ./$2 "$where"
        chmod +x ${where}$2
        echo $'\n'
        echo "$2 installed to $where/$2"
        # Figure out which var to update in dependency_info.txt
        case $2 in
        kustomize)
            last_kustomize_version=$RELEASE_URL
            ;;
        gator)
            last_gator_version=$RELEASE_URL
            ;;
        kpt)
            last_kpt_version=$RELEASE_URL
            ;;
        *)
            err "Something's not quite right with these Versions"
            ;;
        esac
    fi
    popd >& /dev/null
}

######################################################
########## STEP 2 - Install Each Dependency ##########
######################################################

install_dependency \
$KUSTOMIZE_DOWNLOAD_BASE_URL \
kustomize \
kustomize_v*_${opsys}_${arch}.tar.gz \
browser_download.*${opsys}_${arch} \
$last_kustomize_version

install_dependency \
$GATORCLI_DOWNLOAD_BASE_URL \
gator \
gator-v*-${opsys}-${arch}.tar.gz \
browser_download.*${opsys}-${arch} \
$last_gator_version

install_dependency \
$KPT_DOWNLOAD_BASE_URL \
kpt \
kpt_${opsys}_${arch}*.tar.gz \
browser_download.*${opsys}_${arch} \
$last_kpt_version

echo $'\nDependencies installed/updated.'

######################################################
######### STEP 3 - Update Configuration File #########
######################################################

# First, update system info if changed
if [[ $system_info != "${opsys}_${arch}" ]]; then
    system_info="${opsys}_${arch}"
    echo "Updated/Logged System Configuration"
fi

# Reconcile dependency_info text file
cat > dependency_info.txt << EOL
LAST_UPDATED=$(date)
SYS_INFO=${system_info}
KPT_VERSION=${last_kpt_version}
KUSTOMIZE_VERSION=${last_kustomize_version}
GATOR_VERSION=${last_gator_version}
EOL

echo $'\nConfiguration updated.'
echo $'\n-----\n'

# Leave dependency folder
cd ..

#########################################################
##### STEP 4 - Make validate.sh a Pre-Commit Hook ######
#########################################################

# Warn user that this scrip will overwrite current pre-commit hook in .git/hooks
read -r -p "This script will overwrite your current ${bold}ACTIVE${normal} 
pre-commit hook. Are you sure you want to continue? [y/N] " response
if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    exit 0
fi

# Move validate.sh script to pre-commit hook folder
echo $'\nUpdating pre-commit hook...'
cp validate.sh .git/hooks/
cd .git/hooks/
mv validate.sh pre-commit

# Make pre-commit hook an executable
echo $'Making pre-commit hook executable...'
chmod +x pre-commit

# Return to project root directory
cd ../../
echo $'Done!'
echo $'\n-----\n'

#########################################################
################# STEP 4 - Validation Prep ##############
#########################################################

# This section will allow a user to easily update their configuration without
# needing to run the main validation script which will be inaccessible in the 
# .git/hooks folder. This configuration includes information on which directories
# to use for constraints, constraint templates, and kubernetes manifests.


# Warn user that this script will overwrite their current configuration.
read -r -p "This script will overwrite your current pre-validate configuration. 
Are you sure you want to continue? [y/N] " response
if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    exit 0
fi
echo $'\n-----\n'


########################################################
################### Obtain Policies ###################
########################################################

# Gator, the application that runs the validation, works with public repositories and local files.
# In this step, the user can define a remote repo or local directory to use for constraints/templates.
# In the case that their constraints and templates don't live in the same place, this is
# Where they can update the location of their templates.

echo $'Gator works with both public repositories and local files. You can provide either in this configuration.'

# Formatting for locations
echo $'\nFormatting'
echo "* For ${bold}remote repositories${normal}, use URL format: 
https://github.com/[USER]/[REPO].git/[SUBDIRECTORY]/[CONSTRAINTS_SUBDIRECTORY]"
echo "* For ${bold}local directories${normal}, input ABSOLUTE directory path"
echo $'* Ensure that the repositories/directories contain ONLY constraint and/
or constraint template manifests.\n'
echo $'* Link DIRECTLY to folder where constraints and/or templates are 
located\n'

# Obtain CONSTRAINT TEMPLATES location
echo $'\n'
echo "${bold}CONSTRAINT TEMPLATES${normal} location:"
echo "* If you are using the open-source constraint templates, ${bold}leave 
BLANK and press ENTER${normal}"
echo "* Open-source constraint templates are located in /
constraints-and-templates/oss-constraint-templates-library."
echo "* They are pulled from https://github.com/open-policy-agent/
gatekeeper-library/library/general."
read -r -p "> " templates_location
if [[ -z $templates_location ]]; then
    templates_location=
    '/constraints-and-templates/oss-constraint-templates-library' 
    # Using OSS Templates
fi

# Obtain CONSTRAINT TEMPLATES location
echo $'\n'
while [[ -z $constraints_location ]]; do
    read -r -p "${bold}CONSTRAINTS${normal} location:`echo $'\n> '`" 
    constraints_location
done

# See if user is going to be using Kustomize or not
echo $'\n'
echo "${bold}USING KUSTOMIZE${normal}:"
read -r -p "Are you using Kustomize? If so, you will need to specify which 
environment you would like to build every time you commit changes. [y/N]" 
kustomize_yes_no
if [[ "$kustomize_yes_no" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    kustomize_yes_no_answer="YES"
fi

# Obtain KUBERNETES MANIFESTS location if user IS using Kustomize:
if [[ $kustomize_yes_no_answer == "YES" ]]; then
    echo $'\n'
    echo "${bold}KUBERNETES MANIFESTS${normal} location -- should be a local 
    directory:"
    echo "* If you are running this script in that directory, please press 
    ENTER."
    read -r -p "> " kubernetes_filepath
    if [[ -z $kubernetes_filepath ]]; then
        kubernetes_filepath=$PWD
    fi
    echo $'\n-----\n'
fi

########################################################
############# Prepare Variables for Hook ###############
########################################################

# Create or overwrite configuration directory
touch .oss_dependencies/user_config.txt

# Reconcile constraints into text file ---- TODO: STILL NECESSARY IF COULD 
# EXPORT VARS?
cat > .oss_dependencies/user_config.txt << EOL
TEMPLATES_LOCATION=$templates_location
CONSTRAINTS_LOCATION=$constraints_location
KUBERNETES_DIR=$kubernetes_filepath
KUSTOMIZED_FILES=$kustomize_yes_no_answer
EOL

# Leave and Exit
cd ..
echo $'\nConfiguration Updated'