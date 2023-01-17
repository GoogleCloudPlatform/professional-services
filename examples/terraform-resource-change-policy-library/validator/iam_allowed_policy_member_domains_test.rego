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

import data.test.fixtures.iam_allowed_policy_member_domains.assets.resource_changes as fixture_assets
import data.test.fixtures.iam_allowed_policy_member_domains.constraints as fixture_constraints

# Find all violations on our test cases
find_violations[get_violation] {
	instance := data.instances[_]
	constraint := data.test_constraints[_]

	# trace(sprintf("INstance: %s", [instance]))
	# trace(sprintf("Constraint: %s", [constraint]))

	issues := violation with input.review as instance
		with input.parameters as constraint.spec.parameters

	total_issues := count(issues)

	# trace(sprintf("Issues found in find_violations: %s", [issues[_]]))
	get_violation := issues[_]
}

# Confim no violations with no resources
test_no_resources {
	found_violations := find_violations with data.instances as []

	count(found_violations) = 0
}

violations_one_project[violation] {
	constraints := [fixture_constraints.iam_allowed_policy_member_two_domains]

	found_violations := find_violations with data.instances as fixture_assets
		with data.test_constraints as constraints

	violation := found_violations[_]
}

test_one_project_with_unexpected_domain {
	found_violations := violations_one_project

	count_viol := count(found_violations[_])

	# trace(sprintf("count viol %s", [count_viol]))
	count_viol = 2

	members := {m | m = found_violations[_].details.member}

	# trace(sprintf("count members %s", [members]))
	members == {"user:bad@notgoogle.com", "serviceAccount:service-12345@notiam.gserviceaccount.com", "user:evil@notgoogle.com", "allUsers", "allAuthenticatedUsers"}
}

violations_project_reference[violation] {
	constraints := [fixture_constraints.iam_allowed_policy_member_reject_project_reference]

	found_violations := find_violations with data.instances as fixture_assets
		with data.test_constraints as constraints

	violation := found_violations[_]
}

test_reject_project_reference {
	found_violations := violations_project_reference
	count(found_violations) = 2
	found_violations[_].details.resource == "viewer-12345"
}

violations_reject_sub_domains[violation] {
	constraints := [fixture_constraints.iam_allowed_policy_member_reject_sub_domains]

	found_violations := find_violations with data.instances as fixture_assets
		with data.test_constraints as constraints

	violation := found_violations[_]
}

test_reject_sub_domains {
	found_violations := violations_reject_sub_domains
	count(found_violations) = 3
	trace(sprintf("Found violations test one proj unex domain: %v", [found_violations]))

	members := {m | m = found_violations[_].details.member}
	members == {"allAuthenticatedUsers", "allUsers", "serviceAccount:service-186783260185@dataflow-service-producer-prod.iam.gserviceaccount.com"}
}
