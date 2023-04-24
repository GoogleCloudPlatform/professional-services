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

package templates.gcp.TFGCPIAMAllowBanRolesConstraintV1

import data.test.fixtures.iam_allow_ban_roles.assets.resource_changes as fixture_assets
import data.test.fixtures.iam_allow_ban_roles.constraints as fixture_constraints

# Find all violations on our test cases
find_violations[get_violation] {
	asset := fixture_assets[_]
	constraint := data.test_constraints[_]

	# violations := [v |
	# 	violations := data.templates.gcp[test_template].violation with input.review as test_assets[_]
	# 		with input.parameters as test_constraints[_].spec.parameters

	# 	v := violations[_]
	# ]

	issues := [i |
		issues := violation with input.review as asset
			with input.parameters as constraint.spec.parameters
		i := issues[_]
	]

	trace(sprintf("issues found: %s", [issues]))

	total_issues := count(issues)

	get_violation := issues[_]
}

allow_all_roles_non_wildcard_violations[get_violation] {
	constraints := [fixture_constraints.iam_allow_ban_roles_allow_all_roles_non_wildcard]

	found_violations := find_violations with data.test_constraints as constraints

	get_violation := found_violations[_]
}

test_allow_all_roles_non_wildcard_violations {
	count(allow_all_roles_non_wildcard_violations) == 0
}

allow_all_roles_wildcard_violations[get_violation] {
	constraints := [fixture_constraints.iam_allow_ban_roles_allow_all_roles_wildcard]

	found_violations := find_violations with data.test_constraints as constraints

	get_violation := found_violations[_]
}

test_allow_all_roles_wildcard_violations {
	count(allow_all_roles_wildcard_violations) == 1
}

allow_one_role_violations[get_violation] {
	constraints := [fixture_constraints.iam_allow_ban_roles_allow_one_role]

	found_violations := find_violations with data.test_constraints as constraints

	get_violation := found_violations[_]
}

test_allow_one_role_violations {
	count(allow_one_role_violations) == 2
}

ban_all_roles_non_wildcard_violations[get_violation] {
	constraints := [fixture_constraints.iam_allow_ban_roles_ban_all_roles_non_wildcard]

	found_violations := find_violations with data.test_constraints as constraints

	get_violation := found_violations[_]
}

test_ban_all_roles_non_wildcard_violations {
	trace(sprintf("banallroles: %s", [count(ban_all_roles_non_wildcard_violations)]))
	count(ban_all_roles_non_wildcard_violations) == 3
}

ban_all_roles_wildcard_violations[get_violation] {
	constraints := [fixture_constraints.iam_allow_ban_roles_ban_all_roles_wildcard]

	found_violations := find_violations with data.test_constraints as constraints

	get_violation := found_violations[_]
}

test_ban_all_roles_wildcard_violations {
	count(ban_all_roles_wildcard_violations) == 2
}

ban_one_role_violations[get_violation] {
	constraints := [fixture_constraints.iam_allow_ban_roles_ban_one_role]

	found_violations := find_violations with data.test_constraints as constraints

	get_violation := found_violations[_]
}

test_ban_one_role_violations {
	count(ban_one_role_violations) == 0
}
