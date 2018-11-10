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

# skip interactive post-install configuration steps
export DEBIAN_FRONTEND=noninteractive

sudo apt-get update -y
sudo apt-get install -y curl software-properties-common
sudo apt-add-repository -y ppa:ansible/ansible

# Install kubectl
sudo apt-get update && apt-get install -y apt-transport-https curl
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
cat <<EOF >/etc/apt/sources.list.d/kubernetes.list
deb http://apt.kubernetes.io/ kubernetes-xenial main
EOF
sudo apt-get update
sudo apt-get install -y kubectl

# Update base
sudo apt-get update -y
sudo apt-get -y \
  -o Dpkg::Options::="--force-confdef" \
  -o Dpkg::Options::="--force-confold" upgrade

# install base packages
sudo apt-get install -y --force-yes \
  ansible \
  xfsprogs \
  tmux \
  htop \
  vim \
  debconf-utils \
  unzip \
  jq

# install a sane python sitewide
sudo apt-get install -y build-essential python-dev python-pip ipython python-setuptools libffi-dev libssl-dev

# hack, remove existing ansible to resolve a bug
sudo rm -rf /usr/local/lib/python2.7/dist-packages/ansible*

# TODO: Add Google CLI stuff
# sudo pip install awscli con-fu netaddr ansible==2.2

# Update to Linux HWE/LTS to reolve Intel CVEs
# //TODO: test this, is it still needed?
# https://wiki.ubuntu.com/SecurityTeam/KnowledgeBase/SpectreAndMeltdown
# sudo apt-get install \
#   -o Dpkg::Options::="--force-confdef" \
#   -o Dpkg::Options::="--force-confold" -y \
#   linux-image-hwe-generic-trusty \
#   linux-headers-generic-lts-xenial
