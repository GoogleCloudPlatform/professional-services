#
# Copyright 2022 Google LLC
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
#

package templates.gcp.TFGCPIAMAllowedPolicyMemberDomainsConstraintV2

# import data.validator.gcp.lib as lib

violation[{
	"msg": message,
	"details": metadata,
}] {
	# NOTE: For Terraform review object, the following schema is followed:
	# review: {
	# 	change: {
	# 		actions: ["create"],
	# 		after: {
	#			condition: []
	#			members: []
	#			project:
	# 			role: 
	# 		}
	# 	},
	# 	mode:
	# 	name: 
	# 	provider_name:
	# 	type:
	# }

	# Outdated Gatekeeper format, updating to v1beta1
	params := input.parameters

	# Use input.review for TF changes (see schema above)
	resource := input.review

	resource.type == "google_project_iam_binding"
	not resource.change.actions[0] == "delete"

	unique_members := {m | m = resource.change.after.members[_]}
	member_type_allowlist := object.get(params, "member_type_allowlist", ["projectOwner", "projectEditor", "projectViewer"])

	members_to_check := [m | m = unique_members[_]; not starts_with_allowlisted_type(member_type_allowlist, m)]

	member := members_to_check[_]

	allow_sub_domains := object.get(params, "allow_sub_domains", true)

	no_match(allow_sub_domains, params.domains, member)

	message := sprintf("IAM policy for %v contains member from unexpected domain: %v", [resource.name, member])

	metadata := {
		"resource": resource.name,
		"member": member,
		"tf_address": resource.address,
	}
}

# Matches domains/subdomains based on regex
no_match(allow_sub_domains, domains, member) {
	allow_sub_domains == true
	matched_domains := [m | m = member; re_match(sprintf("[:@.]%v$", [domains[_]]), member)]
	count(matched_domains) == 0
}

no_match(allow_sub_domains, domains, member) {
	allow_sub_domains == false
	matched_domains := [m | m = member; re_match(sprintf("[:@]%v$", [domains[_]]), member)]
	count(matched_domains) == 0
}

# Determines if the member starts with allowlisted type of member (optional param)
starts_with_allowlisted_type(allowlist, member) {
	member_type := allowlist[_]
	startswith(member, sprintf("%v:", [member_type]))
}
