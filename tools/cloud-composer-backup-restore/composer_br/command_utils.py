# Copyright 2022 Google LLC
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
"""
Miscallenous set of util functions used across different modules to move,
upload files and run bash commands.
"""
import subprocess
import shutil


def sh(command: list,
       output=subprocess.PIPE,
       err=subprocess.STDOUT,
       use_shell=False) -> str:
    """
    A wrapper around subprocess for executing shell commands
    """
    with subprocess.Popen(command, stdout=output, stderr=err,
                          shell=use_shell) as proc:
        try:
            command_result = proc.communicate(timeout=15)
            return command_result
        except subprocess.TimeoutExpired:
            proc.kill()


def gke(namespace: str, pod_name: str, cmd: list) -> str:
    """
    Shortcut function to run a command on a remote
    GKE cluster via kubectl
    """
    kubectl_check = shutil.which('kubectl')
    if kubectl_check is not None:
        kube_command = [
            'kubectl', 'exec', '-t', '-n', namespace, pod_name, '--', 'bash',
            '-c'
        ]
        return sh(kube_command.extend(cmd))
    raise ValueError('kubectl command not found')


def check_commands(commands: list) -> list:
    """
    Checks if all commands in the list exist in the system / environment
    returns a list of all missing commands
    """
    missing = []
    for cmd in commands:
        if shutil.which(cmd) is None:
            missing.append(cmd)
    return missing
