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

$ErrorActionPreference = "stop"

# Install required Windows features
Install-WindowsFeature Failover-Clustering -IncludeManagementTools
Install-WindowsFeature RSAT-AD-PowerShell
Install-WindowsFeature RSAT

# Open firewall for WSFC
netsh advfirewall firewall add rule name="Allow SQL Server health check" dir=in action=allow protocol=TCP localport=${health_check_port}

# Open firewall for SQL Server
netsh advfirewall firewall add rule name="Allow SQL Server" dir=in action=allow protocol=TCP localport=1433

# Open firewall for SQL Server replication
netsh advfirewall firewall add rule name="Allow SQL Server replication" dir=in action=allow protocol=TCP localport=5022

# Format data disk
Get-Disk |
 Where partitionstyle -eq 'RAW' |
 Initialize-Disk -PartitionStyle MBR -PassThru |
 New-Partition -AssignDriveLetter -UseMaximumSize |
 Format-Volume -FileSystem NTFS -NewFileSystemLabel 'Data' -Confirm:$false

# Create data and log folders for SQL Server
md d:\Data
md d:\Logs

Restart-Computer
