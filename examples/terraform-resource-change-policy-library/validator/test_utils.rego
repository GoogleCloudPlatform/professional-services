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

package validator.test_utils

get_test_violations(test_assets, test_constraints, test_template) = violations {
	# trace(sprintf("test_assets: %s", [test_assets]))
	# trace(sprintf("test_constraints: %s", [test_constraints]))

	# trace(sprintf("test_template: %s", [test_template]))
	violations := [v |
		violations := data.templates.gcp[test_template].violation with input.review as test_assets[_]
			with input.parameters as test_constraints[_].spec.parameters

		v := violations[_]
	]
	# trace(sprintf("Violations from test %v: %v", [test_template, violations[_]]))
}

check_test_violations_count(test_assets, test_constraints, test_template, expected_count) {
	# trace(sprintf("test_assets: %s", [test_assets]))
	# trace(sprintf("test_constraints: %s", [test_constraints]))
	# trace(sprintf("test_template: %s", [test_template]))
	# trace(sprintf("expected_count: %v", [expected_count]))
	violations := get_test_violations(test_assets, test_constraints, test_template)
	count(violations) == expected_count
}

check_test_violations_resources(test_assets, test_constraints, test_template, expected_resource_names) {
	violations := get_test_violations(test_assets, test_constraints, test_template)
	resource_names := {x | x = violations[_].details.resource}
	resource_names == expected_resource_names
}

# This is to check for other field names from violations besides resource
check_test_violations_metadata(test_assets, test_constraints, test_template, field_name, field_values) {
	# trace(sprintf("test_assets: %s", [test_assets]))
	# trace(sprintf("test_constraints: %s", [test_constraints]))
	# trace(sprintf("test_template: %s", [test_template]))
	# trace(sprintf("field_name: %s", [field_name]))
	# trace(sprintf("field_values: %s", [field_values]))

	violations := get_test_violations(test_assets, test_constraints, test_template)

	# trace(sprintf("Violations from test %v: %v", [test_template, violations]))

	# trace(sprintf("violations: %s", [violations]))
	resource_names := {x | x = violations[_].details[field_name]}

	trace(sprintf("resource_names: %s", [resource_names]))
	resource_names == field_values
}

check_test_violations_signature(test_assets, test_constraints, test_template) {
	violations := get_test_violations(test_assets, test_constraints, test_template)
	violation := violations[_]
	is_string(violation.msg)
	is_object(violation.details)
}

check_test_violations(test_assets, test_constraints, test_template, expected_resource_names) {
	check_test_violations_count(test_assets, test_constraints, test_template, count(expected_resource_names))
	check_test_violations_resources(test_assets, test_constraints, test_template, expected_resource_names)
	check_test_violations_signature(test_assets, test_constraints, test_template)
}
