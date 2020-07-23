#!/bin/bash

# Copyright 2019 Google LLC
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

################################################################################
# Checkout the repo for a PR and add the remote of the target branch           #
################################################################################

# Fetches master branch from GitHub and "resets" local changes to be relative to it,
# so we can diff what changed relatively to master branch.
git init
git config user.email "ia-tests@presubmit.example.com"
git config user.name "ia-tests"

git commit -m "empty commit"
git remote add origin "${BASE_REPO_URL}"
git fetch origin master

# Fetch all PRs to get history for PRs created from forked repos
git fetch origin +refs/pull/*/merge:refs/remotes/origin/pr/*

git reset --hard "origin/pr/${PR_NUMBER}"

if ! git rebase "origin/${BASE_BRANCH}"
then
  exit 1
fi

echo "successfully rebased PR  #${PR_NUMBER} on master"
