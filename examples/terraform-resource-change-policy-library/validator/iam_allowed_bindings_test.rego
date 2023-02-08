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

# NOT SUPPORTED: BQ, Dataset, Storage

package templates.gcp.TFGCPIAMAllowedBindingsConstraintV3

template_name := "TFGCPIAMAllowedBindingsConstraintV3"

import data.validator.test_utils as test_utils

import data.test.fixtures.iam_allowed_bindings.assets.resource_changes as fixture_assets
import data.test.fixtures.iam_allowed_bindings.constraints as fixture_constraints

# Test denylist project
test_denylist_project_violation_count {
	test_utils.check_test_violations_count(fixture_assets, [fixture_constraints.iam_allowed_bindings_denylist_project], template_name, 1)
}

# Test denylist public
test_denylist_public_violation_count {
	test_utils.check_test_violations_count(fixture_assets, [fixture_constraints.iam_allowed_bindings_denylist_public], template_name, 2)
}

# Test denylist role
test_denylist_role_violation_count {
	test_utils.check_test_violations_count(fixture_assets, [fixture_constraints.iam_allowed_bindings_denylist_role], template_name, 2)
}

# Test allowlist role domain
test_allowlist_role_domain_violation_count {
	test_utils.check_test_violations_count(fixture_assets, [fixture_constraints.iam_allowed_bindings_allowlist_role_domain], template_name, 1)
}

test_allowlist_role_domain_violations {
	violations := test_utils.get_test_violations(fixture_assets, [fixture_constraints.iam_allowed_bindings_allowlist_role_domain], template_name)
	deny_ruling := violations[_]
	deny_ruling.details.role == "roles/owner"
	deny_ruling.details.member == "user:evil@notgoogle.com"
}

# Test allowlist role members (no violations)
test_allowlist_role_violation_count {
	test_utils.check_test_violations_count(fixture_assets, [fixture_constraints.iam_allowed_bindings_allowlist_role_members], template_name, 0)
}
