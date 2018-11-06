# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#!/bin/bash -xe

APP="nginx"
APP_DIR=/opt/$APP

BUILDER_DIR="/tmp/builder"

run_command () {
    echo "Running script [$1]"
    chmod +x $1
    (cd $BUILDER_DIR/setup-scripts; BUILDER_DIR=$BUILDER_DIR $1 )
    if [ $? -ne "0" ]; then
        echo "Exiting. Failed to execute [$1]"
        exit 1
    fi
}

setup_base() {
    echo "Creating base directories for platform."
    mkdir -p $APP_DIR
    mkdir -p $APP_DIR/deploy/appsource/
    mkdir -p /opt/appdir
    mkdir -p /var/app/staging
    mkdir -p /var/app/current
    mkdir -p /var/log/nginx/healthd/
    mkdir -p /var/log/tomcat/

    echo "Setting permissions in /opt/appdir"
    find /opt/appdir -type d -exec chmod 755 {} \; -print
    chown -R root:root /opt/appdir/

    echo "Setting permissions for shell scripts"
    find /opt/appdir/ -name "*.sh" -exec chmod 755 {} \; -print
}

set_permissions() {
    echo "Setting permissions for /tmp"
    chmod 1777 /tmp
    chown root:root /tmp
}

prepare_platform_base() {
    setup_base
    set_permissions
}

sync_platform_uploads() {
    ##### COPY THE everything in platform-uploads to / ####
    echo "Setting up platform hooks"
    rsync -ar $BUILDER_DIR/platform-uploads/ /
}

run_setup_scripts() {
    for entry in $( ls $BUILDER_DIR/setup-scripts/*.sh | sort ) ; do
        run_command $entry
    done
}

run_ansible_provisioning_plays(){
    pushd $BUILDER_DIR
    echo `pwd`
    sudo mkdir -p /etc/ansible
    sudo echo 'localhost ansible_connection=local' > /etc/ansible/hosts
    echo `ansible --version`
    echo "Starting hardening and base ansible roles implementation"
    ansible-playbook /tmp/builder/tmp/playbook.yml \
    -e partitioning=False \
    --skip-tags=\"section1.2.1,section1.3,section3.2.4,section3.2.8,section4.1,section4.3.1,section4.1.12.2,section5.2\"
    popd
}

cleanup() {
    echo "Done all customization of packer instance. Cleaning up"
    # yum -y clean all && sudo rm -rf /tmp/* /var/tmp/*
    rm -rf $BUILDER_DIR
}
# echo "Sync data"
# sync_platform_uploads
echo "Preparing base"
prepare_platform_base
echo "Running packer builder script"
run_setup_scripts
echo "Running ansible plays"
run_ansible_provisioning_plays
echo "Running cleanup"
cleanup
echo "Setting permissions"
set_permissions
