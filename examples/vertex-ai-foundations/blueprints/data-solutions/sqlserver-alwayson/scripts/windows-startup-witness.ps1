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

${functions}

$ErrorActionPreference = "stop"
$InitialSetup = 'c:\InitialSetupDone.txt'

$WitnessPath = "C:\QWitness"
$BackupPath = "C:\Backup"

if (-not(Test-Path -Path $InitialSetup -PathType Leaf)) {
  Write-Output "Performing initial setup for witness"
  
  All-Instances-Ready

  if (-not(Test-Path -Path $WitnessPath -PathType Container)) {
    Write-Log "Creatin witness directory $WitnessPath and share..."
    New-Item $WitnessPath -type directory
    New-SmbShare -Name QWitness -Path $WitnessPath -Description "SQL File Share Quorum Witness" -FullAccess ${node_netbios_1}$,${node_netbios_2}$
    Start-Sleep -s 10
  }

  if (-not(Test-Path -Path $BackupPath -PathType Container)) {
    Write-Log "Creating backup directory $BackupPath and share..."
    New-Item $BackupPath -type directory
    New-SmbShare -Name Backup -Path $BackupPath -Description "SQL Backup" -FullAccess ${ad_domain}\${sql_user_name}
    Start-Sleep -s 10
  }

  icacls $WitnessPath /t /grant '${node_netbios_1}$:(OI)(CI)(M)'
  icacls $WitnessPath /t /grant '${node_netbios_2}$:(OI)(CI)(M)'  

  Cluster-In-Domain

  Start-Sleep -s 30

  icacls $WitnessPath /grant '${sql_cluster_name}$:(OI)(CI)(M)'
  Grant-SmbShareAccess -Name QWitness -AccountName '${sql_cluster_name}$' -AccessRight Full -Force

  New-Item "$WitnessPath\SetupDone.txt"
  New-Item $InitialSetup
}