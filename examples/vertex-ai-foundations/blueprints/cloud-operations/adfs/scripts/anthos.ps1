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

param($DnsName)

$ApplicationGroup = Get-AdfsApplicationGroup -Name Anthos

$ApplicationGroupName = "Anthos"
$ApplicationGroupIdentifier = (New-Guid).Guid
New-AdfsApplicationGroup -Name $ApplicationGroupName `
-ApplicationGroupIdentifier $ApplicationGroupIdentifier

$ServerApplicationName = "$ApplicationGroupName Server App"
$ServerApplicationIdentifier = (New-Guid).Guid
$RelyingPartyTrustName = "Anthos"
$RelyingPartyTrustIdentifier = (New-Guid).Guid
$RedirectURI1 = "http://localhost:1025/callback"
$RedirectURI2 = "https://console.cloud.google.com/kubernetes/oidc"

$ADFSApp = Add-AdfsServerApplication -Name $ServerApplicationName `
-ApplicationGroupIdentifier $ApplicationGroupIdentifier `
-RedirectUri $RedirectURI1,$RedirectURI2  `
-Identifier $ServerApplicationIdentifier `
-GenerateClientSecret

$IssuanceTransformRules = @'
@RuleTemplate = "LdapClaims"
@RuleName = "groups"
c:[Type == "http://schemas.microsoft.com/ws/2008/06/identity/claims/windowsaccountname", Issuer == "AD AUTHORITY"]
=> issue(store = "Active Directory", types = ("http://schemas.xmlsoap.org/claims/Group"), query = ";tokenGroups(domainQualifiedName);{0}", param = c.Value);
'@

Add-AdfsRelyingPartyTrust -Name $RelyingPartyTrustName `
-Identifier $RelyingPartyTrustIdentifier `
-AccessControlPolicyName "Permit everyone" `
-IssuanceTransformRules "$IssuanceTransformRules"

Grant-ADFSApplicationPermission -ClientRoleIdentifier $ServerApplicationIdentifier `
-ServerRoleIdentifier $RelyingPartyTrustIdentifier `
-ScopeName "allatclaims", "openid" 

@"
authentication:
  oidc:
    clientID: $($ADFSApp.Identifier)
    clientSecret: $($ADFSApp.ClientSecret)
    extraParams: resource=$RelyingPartyTrustIdentifier
    group: groups
    groupPrefix: ""
    issuerURI: https://$DnsName/adfs
    kubectlRedirectURL: $RedirectURI1
    scopes: openid
    username: upn
    usernamePrefix: ""
"@