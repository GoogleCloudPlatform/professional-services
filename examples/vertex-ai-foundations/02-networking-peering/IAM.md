# IAM bindings reference

Legend: <code>+</code> additive, <code>•</code> conditional.

## Project <i>dev-net-spoke-0</i>

| members | roles |
|---|---|
|<b>dev-resman-pf-0</b><br><small><i>serviceAccount</i></small>|[roles/resourcemanager.projectIamAdmin](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectIamAdmin) <code>•</code><br>[roles/dns.admin](https://cloud.google.com/iam/docs/understanding-roles#dns.admin) |
|<b>prod-resman-pf-0</b><br><small><i>serviceAccount</i></small>|organizations/[org_id #0]/roles/serviceProjectNetworkAdmin |

## Project <i>prod-net-spoke-0</i>

| members | roles |
|---|---|
|<b>prod-resman-pf-0</b><br><small><i>serviceAccount</i></small>|[roles/resourcemanager.projectIamAdmin](https://cloud.google.com/iam/docs/understanding-roles#resourcemanager.projectIamAdmin) <code>•</code><br>organizations/[org_id #0]/roles/serviceProjectNetworkAdmin <br>[roles/dns.admin](https://cloud.google.com/iam/docs/understanding-roles#dns.admin) |
