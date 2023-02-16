# IAM bindings reference

Legend: <code>+</code> additive, <code>•</code> conditional.

## Organization <i>[org_id #0]</i>

| members | roles |
|---|---|
|<b>dev-resman-dp-0</b><br><small><i>serviceAccount</i></small>|[roles/orgpolicy.policyAdmin](https://cloud.google.com/iam/docs/understanding-roles#orgpolicy.policyAdmin) <code>+</code><code>•</code><br>[roles/billing.user](https://cloud.google.com/iam/docs/understanding-roles#billing.user) <code>+</code>|
|<b>dev-resman-gke-0</b><br><small><i>serviceAccount</i></small>|[roles/billing.user](https://cloud.google.com/iam/docs/understanding-roles#billing.user) <code>+</code>|
|<b>dev-resman-pf-0</b><br><small><i>serviceAccount</i></small>|[roles/orgpolicy.policyAdmin](https://cloud.google.com/iam/docs/understanding-roles#orgpolicy.policyAdmin) <code>+</code><code>•</code><br>[roles/billing.costsManager](https://cloud.google.com/iam/docs/understanding-roles#billing.costsManager) <code>+</code><br>[roles/billing.user](https://cloud.google.com/iam/docs/understanding-roles#billing.user) <code>+</code>|
|<b>prod-resman-dp-0</b><br><small><i>serviceAccount</i></small>|[roles/orgpolicy.policyAdmin](https://cloud.google.com/iam/docs/understanding-roles#orgpolicy.policyAdmin) <code>+</code><code>•</code><br>[roles/billing.user](https://cloud.google.com/iam/docs/understanding-roles#billing.user) <code>+</code>|
|<b>prod-resman-gke-0</b><br><small><i>serviceAccount</i></small>|[roles/billing.user](https://cloud.google.com/iam/docs/understanding-roles#billing.user) <code>+</code>|
|<b>prod-resman-net-0</b><br><small><i>serviceAccount</i></small>|[roles/billing.user](https://cloud.google.com/iam/docs/understanding-roles#billing.user) <code>+</code><br>[roles/compute.orgFirewallPolicyAdmin](https://cloud.google.com/iam/docs/understanding-roles#compute.orgFirewallPolicyAdmin) <code>+</code><br>[roles/compute.xpnAdmin](https://cloud.google.com/iam/docs/understanding-roles#compute.xpnAdmin) <code>+</code>|
|<b>prod-resman-pf-0</b><br><small><i>serviceAccount</i></small>|[roles/orgpolicy.policyAdmin](https://cloud.google.com/iam/docs/understanding-roles#orgpolicy.policyAdmin) <code>+</code><code>•</code><br>[roles/billing.costsManager](https://cloud.google.com/iam/docs/understanding-roles#billing.costsManager) <code>+</code><br>[roles/billing.user](https://cloud.google.com/iam/docs/understanding-roles#billing.user) <code>+</code>|
|<b>prod-resman-sec-0</b><br><small><i>serviceAccount</i></small>|[roles/accesscontextmanager.policyAdmin](https://cloud.google.com/iam/docs/understanding-roles#accesscontextmanager.policyAdmin) <code>+</code><br>[roles/billing.user](https://cloud.google.com/iam/docs/understanding-roles#billing.user) <code>+</code>|

## Folder <i>development [#0]</i>

| members | roles |
|---|---|
|<b>dev-resman-dp-0</b><br><small><i>serviceAccount</i></small>|organizations/[org_id #0]/roles/serviceProjectNetworkAdmin <br>[roles/logging.admin](https://cloud.google.com/iam/docs/understanding-roles#logging.admin) <br>[roles/owner](https://cloud.google.com/iam/docs/understanding-roles#owner) <br>[roles/resourcemanager.folderAdmin](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.folderAdmin) <br>[roles/resourcemanager.projectCreator](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectCreator) |

## Folder <i>development [#1]</i>

| members | roles |
|---|---|
|<b>dev-resman-gke-0</b><br><small><i>serviceAccount</i></small>|[roles/compute.xpnAdmin](https://cloud.google.com/iam/docs/understanding-roles#compute.xpnAdmin) <br>[roles/logging.admin](https://cloud.google.com/iam/docs/understanding-roles#logging.admin) <br>[roles/owner](https://cloud.google.com/iam/docs/understanding-roles#owner) <br>[roles/resourcemanager.folderAdmin](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.folderAdmin) <br>[roles/resourcemanager.projectCreator](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectCreator) |

## Folder <i>development [#2]</i>

| members | roles |
|---|---|
|<b>dev-resman-dp-0</b><br><small><i>serviceAccount</i></small>|organizations/[org_id #0]/roles/serviceProjectNetworkAdmin |
|<b>dev-resman-gke-0</b><br><small><i>serviceAccount</i></small>|organizations/[org_id #0]/roles/serviceProjectNetworkAdmin |
|<b>dev-resman-pf-0</b><br><small><i>serviceAccount</i></small>|organizations/[org_id #0]/roles/serviceProjectNetworkAdmin |

## Folder <i>development [#3]</i>

| members | roles |
|---|---|
|<b>dev-resman-pf-0</b><br><small><i>serviceAccount</i></small>|organizations/[org_id #0]/roles/serviceProjectNetworkAdmin <br>[roles/logging.admin](https://cloud.google.com/iam/docs/understanding-roles#logging.admin) <br>[roles/owner](https://cloud.google.com/iam/docs/understanding-roles#owner) <br>[roles/resourcemanager.folderAdmin](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.folderAdmin) <br>[roles/resourcemanager.projectCreator](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectCreator) |

## Folder <i>development [#4]</i>

| members | roles |
|---|---|
|<b>dev-resman-pf-0</b><br><small><i>serviceAccount</i></small>|organizations/[org_id #0]/roles/serviceProjectNetworkAdmin <br>[roles/logging.admin](https://cloud.google.com/iam/docs/understanding-roles#logging.admin) <br>[roles/owner](https://cloud.google.com/iam/docs/understanding-roles#owner) <br>[roles/resourcemanager.folderAdmin](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.folderAdmin) <br>[roles/resourcemanager.projectCreator](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectCreator) |

## Folder <i>networking</i>

| members | roles |
|---|---|
|<b>gcp-network-admins</b><br><small><i>group</i></small>|[roles/editor](https://cloud.google.com/iam/docs/understanding-roles#editor) |
|<b>prod-resman-net-0</b><br><small><i>serviceAccount</i></small>|[roles/compute.xpnAdmin](https://cloud.google.com/iam/docs/understanding-roles#compute.xpnAdmin) <br>[roles/logging.admin](https://cloud.google.com/iam/docs/understanding-roles#logging.admin) <br>[roles/owner](https://cloud.google.com/iam/docs/understanding-roles#owner) <br>[roles/resourcemanager.folderAdmin](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.folderAdmin) <br>[roles/resourcemanager.projectCreator](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectCreator) |

## Folder <i>production [#0]</i>

| members | roles |
|---|---|
|<b>prod-resman-dp-0</b><br><small><i>serviceAccount</i></small>|organizations/[org_id #0]/roles/serviceProjectNetworkAdmin <br>[roles/logging.admin](https://cloud.google.com/iam/docs/understanding-roles#logging.admin) <br>[roles/owner](https://cloud.google.com/iam/docs/understanding-roles#owner) <br>[roles/resourcemanager.folderAdmin](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.folderAdmin) <br>[roles/resourcemanager.projectCreator](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectCreator) |

## Folder <i>production [#1]</i>

| members | roles |
|---|---|
|<b>prod-resman-gke-0</b><br><small><i>serviceAccount</i></small>|[roles/compute.xpnAdmin](https://cloud.google.com/iam/docs/understanding-roles#compute.xpnAdmin) <br>[roles/logging.admin](https://cloud.google.com/iam/docs/understanding-roles#logging.admin) <br>[roles/owner](https://cloud.google.com/iam/docs/understanding-roles#owner) <br>[roles/resourcemanager.folderAdmin](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.folderAdmin) <br>[roles/resourcemanager.projectCreator](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectCreator) |

## Folder <i>production [#2]</i>

| members | roles |
|---|---|
|<b>prod-resman-dp-0</b><br><small><i>serviceAccount</i></small>|organizations/[org_id #0]/roles/serviceProjectNetworkAdmin |
|<b>prod-resman-gke-0</b><br><small><i>serviceAccount</i></small>|organizations/[org_id #0]/roles/serviceProjectNetworkAdmin |
|<b>prod-resman-pf-0</b><br><small><i>serviceAccount</i></small>|organizations/[org_id #0]/roles/serviceProjectNetworkAdmin |

## Folder <i>production [#3]</i>

| members | roles |
|---|---|
|<b>prod-resman-pf-0</b><br><small><i>serviceAccount</i></small>|organizations/[org_id #0]/roles/serviceProjectNetworkAdmin <br>[roles/logging.admin](https://cloud.google.com/iam/docs/understanding-roles#logging.admin) <br>[roles/owner](https://cloud.google.com/iam/docs/understanding-roles#owner) <br>[roles/resourcemanager.folderAdmin](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.folderAdmin) <br>[roles/resourcemanager.projectCreator](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectCreator) |

## Folder <i>production [#4]</i>

| members | roles |
|---|---|
|<b>prod-resman-pf-0</b><br><small><i>serviceAccount</i></small>|organizations/[org_id #0]/roles/serviceProjectNetworkAdmin <br>[roles/logging.admin](https://cloud.google.com/iam/docs/understanding-roles#logging.admin) <br>[roles/owner](https://cloud.google.com/iam/docs/understanding-roles#owner) <br>[roles/resourcemanager.folderAdmin](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.folderAdmin) <br>[roles/resourcemanager.projectCreator](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectCreator) |

## Folder <i>sandbox</i>

| members | roles |
|---|---|
|<b>dev-resman-sbox-0</b><br><small><i>serviceAccount</i></small>|[roles/logging.admin](https://cloud.google.com/iam/docs/understanding-roles#logging.admin) <br>[roles/owner](https://cloud.google.com/iam/docs/understanding-roles#owner) <br>[roles/resourcemanager.folderAdmin](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.folderAdmin) <br>[roles/resourcemanager.projectCreator](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectCreator) |

## Folder <i>security</i>

| members | roles |
|---|---|
|<b>gcp-security-admins</b><br><small><i>group</i></small>|[roles/viewer](https://cloud.google.com/iam/docs/understanding-roles#viewer) |
|<b>prod-resman-sec-0</b><br><small><i>serviceAccount</i></small>|[roles/logging.admin](https://cloud.google.com/iam/docs/understanding-roles#logging.admin) <br>[roles/owner](https://cloud.google.com/iam/docs/understanding-roles#owner) <br>[roles/resourcemanager.folderAdmin](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.folderAdmin) <br>[roles/resourcemanager.projectCreator](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectCreator) |

## Folder <i>team a</i>

| members | roles |
|---|---|
|<b>team-a</b><br><small><i>group</i></small>|[roles/viewer](https://cloud.google.com/iam/docs/understanding-roles#viewer) |
|<b>prod-teams-team-a-0</b><br><small><i>serviceAccount</i></small>|[roles/compute.xpnAdmin](https://cloud.google.com/iam/docs/understanding-roles#compute.xpnAdmin) <br>[roles/logging.admin](https://cloud.google.com/iam/docs/understanding-roles#logging.admin) <br>[roles/owner](https://cloud.google.com/iam/docs/understanding-roles#owner) <br>[roles/resourcemanager.folderAdmin](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.folderAdmin) <br>[roles/resourcemanager.projectCreator](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectCreator) |

## Folder <i>team b</i>

| members | roles |
|---|---|
|<b>prod-teams-team-b-0</b><br><small><i>serviceAccount</i></small>|[roles/compute.xpnAdmin](https://cloud.google.com/iam/docs/understanding-roles#compute.xpnAdmin) <br>[roles/logging.admin](https://cloud.google.com/iam/docs/understanding-roles#logging.admin) <br>[roles/owner](https://cloud.google.com/iam/docs/understanding-roles#owner) <br>[roles/resourcemanager.folderAdmin](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.folderAdmin) <br>[roles/resourcemanager.projectCreator](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectCreator) |

## Folder <i>teams</i>

| members | roles |
|---|---|
|<b>prod-resman-teams-0</b><br><small><i>serviceAccount</i></small>|[roles/compute.xpnAdmin](https://cloud.google.com/iam/docs/understanding-roles#compute.xpnAdmin) <br>[roles/logging.admin](https://cloud.google.com/iam/docs/understanding-roles#logging.admin) <br>[roles/owner](https://cloud.google.com/iam/docs/understanding-roles#owner) <br>[roles/resourcemanager.folderAdmin](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.folderAdmin) <br>[roles/resourcemanager.projectCreator](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectCreator) |

## Project <i>prod-iac-core-0</i>

| members | roles |
|---|---|
|<b>dev-resman-dp-1</b><br><small><i>serviceAccount</i></small>|[roles/logging.logWriter](https://cloud.google.com/iam/docs/understanding-roles#logging.logWriter) <code>+</code>|
|<b>dev-resman-gke-1</b><br><small><i>serviceAccount</i></small>|[roles/logging.logWriter](https://cloud.google.com/iam/docs/understanding-roles#logging.logWriter) <code>+</code>|
|<b>prod-resman-gke-1</b><br><small><i>serviceAccount</i></small>|[roles/logging.logWriter](https://cloud.google.com/iam/docs/understanding-roles#logging.logWriter) <code>+</code>|
|<b>prod-resman-net-1</b><br><small><i>serviceAccount</i></small>|[roles/logging.logWriter](https://cloud.google.com/iam/docs/understanding-roles#logging.logWriter) <code>+</code>|
