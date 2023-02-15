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

package templates.gcp.TFGCPIAMCustomRolePermissionsConstraintV1

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
	# 			description:
	# 			permissions: []
	# 			project:
	# 			role_id:
	# 			stage:
	# 			title:
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

	resource.type == "google_project_iam_custom_role"
	not resource.change.actions[0] == "delete"

	# Permissions attempting to be granted (see schema above)
	asset_permissions := resource.change.after.permissions[_]

	# Get new IAM Role title (see schema above)
	asset_title := resource.change.after.title

	# Get title value, if no title, use a glob (*)
	params_title := object.get(params, "title", "*")

	# Will pass if glob (*), break if titles don't match otherwise
	check_asset_title(asset_title, params_title)

	# Grab mode (denylist, allowlist)
	mode := object.get(params, "mode", "allowlist")

	# Use set operations to determine if any permissions match
	matches_found = [m | m = config_pattern(params.permissions[_]); glob.match(m, [], asset_permissions)]
	target_match_count(mode, desired_count)
	count(matches_found) != desired_count

	message := sprintf("Role %v grants permission %v", [resource.name, asset_permissions])

	metadata := {
		"resource": resource.name,
		"type": resource.type,
		"role_title": asset_title,
		"permission": asset_permissions,
	}
}

###########################
# Rule Utilities
###########################

# Determine the overlap between matches under test and constraint
target_match_count(mode) = 0 {
	mode == "denylist"
}

target_match_count(mode) = 1 {
	mode == "allowlist"
}

check_asset_title(asset_title, params_title) {
	params_title == "*"
}

check_asset_title(asset_title, params_title) {
	params_title != "*"
	lower(asset_title) == lower(params_title)
}

# If the member in constraint is written as a single "*", turn it into super
# glob "**". Otherwise, we won't be able to match everything.
config_pattern(old_pattern) = "**" {
	old_pattern == "*"
}

config_pattern(old_pattern) = old_pattern {
	old_pattern != "*"
}
