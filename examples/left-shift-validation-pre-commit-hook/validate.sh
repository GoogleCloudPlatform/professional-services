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

# Colors and Formatting
bold=$(tput bold)
normal=$(tput sgr0)
green=$(tput setaf 2)
red=$(tput setaf 1)
yellow=$(tput setaf 3)

########################################################
#################### PRE-CHECK #########################
########################################################

# Only run pre-commit hook if any manifests are updated.
echo "Checking for updated Kubernetes manifests..."
updated_yamls=$(git diff --staged --stat | grep -o '.*\.yaml')

if [ -z "$updated_yamls" ]; then
    echo "No updated manifests found." # Exit script if no updated manifests found
    exit 0
else
    echo "Found updated manifests." # Might have to put rest of code in this if statement if they have MORE precommit hook
    echo "Validating updated manifests..."
fi

########################################################
############### STEP 0 - SCRIPT PRE-WORK ###############
########################################################

# Unset CDPATH to restore default cd behavior. An exported CDPATH can
# cause cd to output the current directory to STDOUT.
unset CDPATH

# Send errors to STDERR
err() {
    err_string="> [$(date +'%Y-%m-%dT%H:%M:%S%z')]: $*"
    printf "%40s\n" "${red}$err_string${normal}" >&2
    exit 1
}

# Instantiate FULL_COMMAND_PATH which will be updated to tell the rest
# of the script where the dependencies live
FULL_COMMAND_PATH_KPT="null"
FULL_COMMAND_PATH_GATOR="null"
FULL_COMMAND_PATH_KUSTOMIZE="null"

# Update the path that is used when each command is run later on in the script.
# This allows the command to be run from the user's path, if it's there, or
# from the dependency folder if the user ran the install script.
function update_path {
    case $1 in
    kustomize)
        FULL_COMMAND_PATH_KUSTOMIZE=$2
        ;;
    gator)
        FULL_COMMAND_PATH_GATOR=$2
        ;;
    kpt)
        FULL_COMMAND_PATH_KPT=$2
        ;;
    *)
        err "Something's not quite right with these Versions"
        ;;
    esac
}

#######################################
# Check if dependencies exists in the user's path
# (ie. can be executed from anywhere);
# if not, see if they have been installed
# to INSTALL_DIR and can be run.
# Globals
#	INSTALL_DIR - Check the specified installation directory if script run
# Arguments:
#	$1 - name of dependency (ie. gator, kpt, etc.)
#######################################
function check_dependency {

    if command -v "$1" &>/dev/null; then
        echo "$1 exists in your path:"
        printf "%40s\n" "$PATH"
        printf "Using preconfigured command, %s\n\n" "$1"
        update_path "$1" "$1"
        return
    elif [[ -f .oss_dependencies/$1 ]]; then
        echo "$1 exists in your dependency folder. Using:"
        printf ".oss_dependencies/%s \n\n" "$1"
        update_path "$1" ".oss_dependencies/$1"
        return
    else
        err "Could not find $1. Please make sure it is installed, either to your PATH, or via the setup.sh script."
    fi
}

########################################################
###### STEP 1 - Ensure Dependencies are Installed ######
########################################################
echo $'Step 1: Ensuring Dependencies are Installed and Properly Configured\n'

check_dependency kpt
check_dependency gator
check_dependency kustomize

echo $'Dependencies installed and properly configured.\n'

########################################################
############ STEP 2 - PREPARE CONFIGURATION ############
########################################################

# Get constraint, template, and k8s locations from dependency_info.txt
user_config=.oss_dependencies/user_config.txt
if [[ ! -f "$user_config" ]]; then
    err "Can't find user configuration. Have you run setup.sh yet?"
fi
export "$(xargs <.oss_dependencies/user_config.txt)"
printf "%s\n" "${yellow}Templates location: $TEMPLATES_LOCATION\n"
printf "%s\n" "Constraints location: $CONSTRAINTS_LOCATION\n"

if [[ -z $KUSTOMIZED_FILES ]]; then
    printf "%s\n" "Using Kustomize: NO"
    printf "%s\n" "K8s Manifests location: <Not using Kustomize>${normal}\n"
else
    printf "%s\n" "Using Kustomize: $KUSTOMIZED_FILES\n"
    printf "%s\n" "K8s Manifests location: $KUBERNETES_DIR ${normal}\n"
fi

########################################################
############## STEP 3 - DOWNLOAD POLICIES ##############
########################################################

# This step fetches your policies from the OPA repository
# and consolidates every resource in a single file.
# echo 'Downloading Policies and Constraint Templates'

#######################################
# Download constraints and templates
# according to their location.
# Arguments:
#   $1 - Location of constraints or templates
#	$2 - Destination directory for constraints
#		 or templates
#######################################
function download_policies() {
    if [[ "$1" == "http"* ]]; then
        # Downloading remote repo containing constraints
        "$FULL_COMMAND_PATH_KPT" version
        "$FULL_COMMAND_PATH_KPT" pkg get "$1" "constraints-and-templates/$2"
    else
        # Copying local constraints to directory
        mkdir "constraints-and-templates/$2"
        cp -a "$1" "constraints-and-templates/$2"
    fi
}

if [[ "$TEMPLATES_LOCATION" == *"/constraints-and-templates/oss-constraint-templates-library"* ]]; then

    # Templates are OSS, get constraints where located
    OSS=TRUE
    download_policies "$CONSTRAINTS_LOCATION" "constraints"

else
    # Temporarily move OSS templates
    OSS=FALSE
    mkdir .temp
    mv constraints-and-templates/oss-constraint-templates-library .temp

    # Constraints and templates in same location
    if [[ "$TEMPLATES_LOCATION" == "$CONSTRAINTS_LOCATION" ]]; then
        download_policies "$CONSTRAINTS_LOCATION" ""

    # Constraints and templates in different locations
    else
        download_policies "$CONSTRAINTS_LOCATION" "constraints"
        download_policies "$TEMPLATES_LOCATION" "templates"

    fi
fi

# Hydrate manifests if user is using Kustomize
# If user isn't using Kustomize, use git diff to fill gator command
# Validate in each situation

if [[ $KUSTOMIZED_FILES == "YES" ]]; then
    # First, open STDIN for user input, which is closed by default for git hooks
    exec </dev/tty
    # This step builds the final manifests for the app
    # using kustomize and the configuration files
    # available in the repository.
    echo $'\n'
    echo "${bold}KUSTOMIZE SOURCES:${normal}"
    printf "%s\n" \
        "* ${red}${bold}If you are NOT using Kustomize, rerun setup.sh${normal}"
    echo "* Please enter the path to your current environment's overlays."
    echo "* i.e. For the Following Folder Structure:"
    echo "* "
    echo "* sample-app/"
    echo "* | -- base/"
    echo "* | 	 | -- deployment.yaml"
    echo "* |	 | -- kustomization.yaml"
    echo "* | -- overlays/"
    echo "*      | -- prod/"
    echo "*      |    | -- deployment.yaml"
    echo "*      |    | -- kustomization.yaml"
    echo "*      | -- dev/"
    echo "*           | -- deployment.yaml"
    echo "*           | -- kustomization.yaml"
    echo "* "
    echo "* Entering ${bold}overlays/prod${normal} would test prod manifests"
    read -r -p "> " environment

    if [[ -z $environment ]]; then
        err "If using Kustomize, you can't leave ${bold}KUSTOMIZE SOURCES:${normal} blank. Please rerun setup.sh if you aren't using Kustomize."
    fi
    # Reclose STDIN
    exec <&-

    # Cleaning hydrated manifests and building new Kustomization
    rm -rf .oss_dependencies/.hydrated_manifests
    # Hydrate manifests and apply kustomize overlays
    mkdir -p .oss_dependencies/.hydrated_manifests
    $FULL_COMMAND_PATH_KUSTOMIZE build "$KUBERNETES_DIR/$environment" >.oss_dependencies/.hydrated_manifests/kustomization.yaml
    # Validates that all resources comply with all policies.
    echo 'Validating against Policies'
    pass_or_fail=$($FULL_COMMAND_PATH_GATOR test -f=.oss_dependencies/.hydrated_manifests/kustomization.yaml -f=constraints-and-templates)
    if [[ -z $pass_or_fail ]] || [[ $pass_or_fail == 'null' ]]; then
        printf "%s\n" \
            "${green}> Congrats! No policy violations found.${normal}"
    else
        found_violations=true
        printf "%s\n" \
            "${red}> Violations found in Kustomized File: .oss_dependencies/.hydrated_manifests/kustomization.yaml"
        printf "%s\n" "> See details below:\n\n${normal}"
        echo "$pass_or_fail"
    fi
else
    # Loop through updated yamls and run gator test against them.
    IFS=$'' read -d '' -r -a files_to_check <<<"$updated_yamls"
    for yaml in $files_to_check; do
        printf "%s\n" "\n> Checking file: $yaml"
        pass_or_fail=$($FULL_COMMAND_PATH_GATOR test -f=constraints-and-templates -f="$yaml")
        if [[ -z $pass_or_fail ]] || [[ $pass_or_fail == 'null' ]]; then
            printf "%s\n" \
                "${green}> Congrats! No policy violations found.${normal}"
        else
            found_violations=true
            printf "%s\n\n" \
                "${red}> Violations found. See details below:${normal}"
            echo "$pass_or_fail"
        fi
    done
fi

# Remove constraints and templates and reset environment
if [[ "$OSS" == "TRUE" ]]; then
    rm -rf constraints-and-templates/constraints
else
    rm -rf constraints-and-templates
    mv .temp constraints-and-templates
fi

# Ask user if they want to
# Open STDIN
exec </dev/tty
if [[ $found_violations = true ]]; then
    printf "%s\n" \
        "${red}> Some resources have policy violations. Would you like to halt the commit and fix these files? [y/N]${normal}"
    read -r -p "> " halt_commit
    if [[ "$halt_commit" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        err "Halting commit due to policy violations."
    fi
fi
# Reclose STDIN
exec <&-
