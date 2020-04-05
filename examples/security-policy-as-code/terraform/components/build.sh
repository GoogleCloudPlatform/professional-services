#!/bin/bash -e
# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


INITIAL_COMPONENTS=( in-scope out-of-scope )
for component in "${INITIAL_COMPONENTS[@]}"; do
  echo "${component}"
  pushd "${component}"
    cp backend.tf.example backend.tf
    if [[ `uname -s` == 'Darwin' ]]; then
      sed -i .tmp  "s/TF_ADMIN_BUCKET/$TF_ADMIN_BUCKET/g" backend.tf
    else
      sed -i  "s/TF_ADMIN_BUCKET/$TF_ADMIN_BUCKET/g" backend.tf
    fi
    terraform init
    terraform plan -out terraform.out
    terraform apply terraform.out
  popd
done

OPTIONAL_COMPONENTS=( logging )
for component in "${OPTIONAL_COMPONENTS[@]}"; do
  echo "${component}"
  pushd "${component}"
    cp backend.tf.example backend.tf
    if [[ `uname -s` == 'Darwin' ]]; then
      sed -i .tmp  "s/TF_ADMIN_BUCKET/$TF_ADMIN_BUCKET/g" backend.tf
    else
      sed -i  "s/TF_ADMIN_BUCKET/$TF_ADMIN_BUCKET/g" backend.tf
    fi
    terraform init
    terraform plan -out terraform.out
    terraform apply terraform.out
  popd
done
