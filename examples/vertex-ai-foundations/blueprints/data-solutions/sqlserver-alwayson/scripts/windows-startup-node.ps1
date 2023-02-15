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
if (-not(Test-Path -Path $InitialSetup -PathType Leaf)) {  
  Write-Log "Performing initial setup"

  $DatabaseName = Invoke-SqlCmd -Query "SELECT serverproperty('ServerName') AS ServerName"
  if (($DatabaseName | Select -ExpandProperty ServerName) -ne $env:computername) {
    Write-Log "Setting up SQL server database..."
    Invoke-Sqlcmd -Query "
      sp_dropserver 'INST-INSTALL-SQ';
      GO
      sp_addserver '$env:computername', local;
      GO"
  }

  All-Instances-Ready

  [System.Reflection.Assembly]::LoadWithPartialName("Microsoft.SqlServer.SqlWmiManagement") | out-null
  $SMOWmiserver = New-Object ("Microsoft.SqlServer.Management.Smo.Wmi.ManagedComputer") $env:computername
  $ChangeService = $SMOWmiserver.Services | where {$_.name -eq "MSSQLSERVER"}

  $UName = "${ad_netbios}\${sql_user_name}"
  $Secret = gcloud --quiet secrets versions access latest --secret="${sql_admin_password_secret}"
  $Password = ConvertTo-SecureString $Secret -AsPlainText -Force

  if ($env:computername -eq "${node_netbios_1}") {
      $SetupScript = @'
$dom = [System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()
$root = $dom.GetDirectoryEntry()
$searcher = [ADSISearcher] $root
$searcher.Filter = "(sAMAccountName=${sql_user_name})"
if ($null -eq $searcher.FindOne())
{
  $Secret = gcloud --quiet secrets versions access latest --secret="${sql_admin_password_secret}"
  $Password = ConvertTo-SecureString $Secret -AsPlainText -Force
  Write-Output "Adding domain user: ${sql_user_name}"
  New-ADUser -Name "${sql_user_name}" -Description "SQL Admin account" -AccountPassword $Password -Enabled $true -PasswordNeverExpires $true ${managed_ad_dn_path}
}
try {
  Get-ADComputer -Identity "${sql_cluster_name}"
} catch {
  Write-Output "Creating cluster: ${sql_cluster_full} (NB: ${sql_cluster_name})"
  New-Cluster -Name ${sql_cluster_full} -Node ${node_netbios_1},${node_netbios_2} -NoStorage -StaticAddress ${cluster_ip}
  Start-Sleep -s 45
%{ if managed_ad_dn != "" }
    
  Write-Output "Adding ${sql_cluster_name}$ to Cloud Service Domain Join Accounts"
  Add-ADGroupMember -Identity "Cloud Service Domain Join Accounts" -Members ${sql_cluster_name}$
%{ endif }
}
$spn = "MSSQLSvc/" + "${node_netbios_1}.$env:userdnsdomain".ToLower()
SetSPN -d "$${spn}:1433" ${node_netbios_1}
SetSPN -d "$${spn}" ${node_netbios_1}
$spn = "MSSQLSvc/" + "${node_netbios_2}.$env:userdnsdomain".ToLower()
SetSPN -d "$${spn}:1433" ${node_netbios_2}
SetSPN -d "$${spn}" ${node_netbios_2}
'@
      $InitializeClusterScript = "C:\InitializeCluster.ps1"
      Write-Log "Writing initial setup script to $InitializeClusterScript"
      $SetupScript | Out-File -FilePath $InitializeClusterScript
  }

  Wait-For-User
  if ($ChangeService.ServiceAccount -ne $UName) {
    Write-Log "Changing SQL server to run under new account..."
    $ChangeService.SetServiceAccount($UName, $Secret)

    Write-Log "Restarting SQL Server..."
    Restart-Service -Name MSSQLSERVER

    Start-Sleep -s 15
  }

  Write-Log "Waiting for cluster to appear..."

  Cluster-Ready
  Node-Up
  Start-Sleep -s 10

  $HADROn = Invoke-SqlCmd -Query "SELECT SERVERPROPERTY('IsHadrEnabled') AS IsHadrEnabled"
  if (($HADROn | Select -ExpandProperty IsHadrEnabled) -ne 1) {
    Write-Log "Enabling HA/DR functionality in SQL Server..."
    Enable-SqlAlwaysOn -ServerInstance $env:computername -Force
    Start-Sleep -s 15

    Invoke-SqlCmd -Query "CREATE LOGIN [${ad_netbios}\${sql_user_name}] FROM WINDOWS"
    Start-Sleep -s 5
  }

  # Wait for other node to finish
  Start-Sleep -s 30

  if ($env:computername -eq "${node_netbios_1}") {    
    $Quorum = Get-ClusterQuorum 
    if ($Quorum.QuorumResource.State -ne "Online") {
        while ($true) {
            try { 
                Write-Log "Turning on witness quorum in cluster..."
                Set-ClusterQuorum -FileShareWitness \\${witness_netbios}\QWitness
                break
            } catch {}
            Start-Sleep -s 5
        }
    }

    [Reflection.Assembly]::LoadWithPartialName("Microsoft.SqlServer.Smo")
    while ($true) {
        $svr = New-Object Microsoft.SqlServer.Management.Smo.Server
        $AllFound = $true
        %{ for aog in split(",", always_on_groups) }
        Write-Log "Waiting for Always On Group: ${aog}..."
        if (($svr.AvailabilityGroups.Count -eq 0) -or (($svr.AvailabilityGroups | Select -ExpandProperty Name) -notmatch "${aog}")) {
            $AllFound = $false
        }
        %{ endfor }
        if ($AllFound) {
            break
        }
        Start-Sleep -s 10
    }

    # Wait until AOGs have settled
    Start-Sleep -s 30

    %{ for aog in split(",", always_on_groups) }
    Write-Log "Configuring Always On Group: ${aog}..."

    $LoadBalancerIP = "${jsondecode(loadbalancer_ips)[aog]}"
    $SqlIpAddress = Get-ClusterResource |
      Where-Object {$_.ResourceType -eq "IP Address"} |
      Where-Object {$_.Name.StartsWith("${aog}")}

    $ClusterParameters = $SqlIpAddress | Get-ClusterParameter
    $ConfiguredIP = $ClusterParameters | Where-Object Name -eq "Address" | Select Value
    if ($ConfiguredIP -ne $LoadBalancerIP) {
        Write-Log "Configuring Always on Group ${aog} with load balancer IP: $LoadBalancerIP"

        $SqlIpAddress | Set-ClusterParameter -Multiple @{
          'Address' = $LoadBalancerIP;
          'ProbePort' = ${health_check_port};
          'SubnetMask' = '255.255.255.255';
          'Network' = (Get-ClusterNetwork).Name;
          'EnableDhcp' = 0; 
        }

        Write-Log "Stopping and starting cluster resource..."       
        $SqlIpAddress | Stop-ClusterResource
        $SqlIpAddress = Get-ClusterResource | Where-Object {$_.Name.StartsWith("${aog}")} | Start-ClusterResource

        Start-Sleep -s 10
    }
    %{ endfor }
  }

  while ($true) {
    Write-Log "Waiting for Hadr_endpoint for GRANT CONNECT..."
    try {
        Invoke-SqlCmd -Query "GRANT CONNECT ON ENDPOINT::Hadr_endpoint TO [${ad_netbios}\${sql_user_name}]"
        break
    } catch {}
    Start-Sleep -s 3
  }

  Write-Log "Setup finished completely."
  New-Item $InitialSetup
}