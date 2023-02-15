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

function Write-Log([string]$message) {
    $message | Tee-Object -FilePath C:\GcpSetupLog.txt -Append | Write-Output
}

function All-Instances-Ready {
  do {
    Write-Log "Checking if computer has joined a domain..."
    $InDomain = (Get-WmiObject -Class Win32_ComputerSystem).PartOfDomain
    if ($InDomain -eq $true) {
      Write-Output "This computer has joined a domain, continuing"
      break
    }
    Start-Sleep -s 5
  } while ($true)

  %{ for node in [node_netbios_1, node_netbios_2, witness_netbios] }
  while ($true) {
    try {
      Write-Log "Waiting for node ${node} to be domain joined..."
      Get-ADComputer -Identity "${node}"
      break
    } catch {
      Start-Sleep -s 5
    }
  }
  %{ endfor }
}

function Wait-For-User {
  $dom = [System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()
  $root = $dom.GetDirectoryEntry()
  $searcher = [ADSISearcher] $root
  $searcher.Filter = "(sAMAccountName=${sql_user_name})"
  while ($null -eq $searcher.FindOne())
  {
    Write-Log "Waiting for Active Directory user for database: ${sql_user_name}"
    Start-Sleep -s 10
  }
}

function Cluster-In-Domain {
  while ($true) {
    try {
      Write-Log "Waiting for cluster ${sql_cluster_name} to be domain joined..."
      Get-ADComputer -Identity "${sql_cluster_name}"
      break
    } catch {
      Start-Sleep -s 5
    }
  }
}

function Cluster-Ready {
  $ClusterName = "${sql_cluster_full}"
  while ($true) {
    Write-Log "Waiting for cluster $ClusterName to appear..."
    try {
      $cluster = Get-Cluster
      $ret = ($cluster.Name -like $ClusterName)
      if ($ret -eq $true) {
        break
      }
    } catch {}
    Start-Sleep -s 10
  }
}

function Node-Up {
  while ($true) {
    Write-Log "Waiting for this node to be up in cluster..."
    try {
        $NodeStatus = Get-ClusterNode | Where-Object Name -eq $env:computername | Select State 
        if ($NodeStatus.State -eq "Up") {
            Write-Log "Current node is up, continuing..."
            break
        }
    } catch {}
    Start-Sleep -s 10
  }
}
