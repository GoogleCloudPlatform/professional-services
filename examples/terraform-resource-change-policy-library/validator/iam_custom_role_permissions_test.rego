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

template_name := "TFGCPIAMCustomRolePermissionsConstraintV1"

import data.validator.test_utils as test_utils

import data.test.fixtures.iam_custom_role_permissions.assets.resource_changes as fixture_assets

import data.test.fixtures.iam_custom_role_permissions.constraints.iam_custom_role_permissions_allowlist as iam_custom_role_permissions_allowlist
import data.test.fixtures.iam_custom_role_permissions.constraints.iam_custom_role_permissions_allowlist_all as iam_custom_role_permissions_allowlist_all
import data.test.fixtures.iam_custom_role_permissions.constraints.iam_custom_role_permissions_denylist as iam_custom_role_permissions_denylist
import data.test.fixtures.iam_custom_role_permissions.constraints.iam_custom_role_permissions_denylist_all as iam_custom_role_permissions_denylist_all
import data.test.fixtures.iam_custom_role_permissions.constraints.iam_custom_role_permissions_no_title as iam_custom_role_permissions_no_title
import data.test.fixtures.iam_custom_role_permissions.constraints.iam_custom_role_permissions_title_caps as iam_custom_role_permissions_title_caps
import data.test.fixtures.iam_custom_role_permissions.constraints.iam_custom_role_permissions_wrong_title as iam_custom_role_permissions_wrong_title

# Test allowlist with wildcards
test_allowlist_wildcards {
	expected_resource_names := {
		"appengine.applications.get",
		"bigquery.config.get",
		"bigquery.config.update",
		"cloudsql.instances.clone",
		"cloudsql.instances.create",
		"cloudsql.instances.delete",
		"cloudsql.instances.export",
		"cloudsql.instances.failover",
		"cloudsql.instances.getIamPolicy",
		"cloudsql.instances.import",
		"compute.disks.list",
		"compute.disks.resize",
		"compute.globalOperations.get",
		"compute.globalOperations.list",
		"resourcemanager.projects.list",
	}

	test_utils.check_test_violations_metadata(fixture_assets, [iam_custom_role_permissions_allowlist], template_name, "permission", expected_resource_names)
}

# Test denylist with wildcards
test_denylist_wildcards {
	expected_resource_names := {
		"bigquery.datasets.create",
		"bigquery.datasets.delete",
		"bigquery.datasets.get",
		"cloudsql.instances.get",
		"compute.images.getFromFamily",
		"compute.images.list",
		"compute.images.setLabels",
		"datastore.entities.allocateIds",
		"datastore.entities.create",
		"datastore.entities.delete",
		"datastore.entities.get",
		"datastore.entities.list",
		"datastore.entities.update",
		"datastore.operations.delete",
		"datastore.operations.get",
		"datastore.operations.list",
		"datastore.statistics.get",
		"datastore.statistics.list",
		"resourcemanager.projects.get",
	}

	test_utils.check_test_violations_metadata(fixture_assets, [iam_custom_role_permissions_denylist], template_name, "permission", expected_resource_names)
}

# Test allowlist for all permissions
test_allowlist_all {
	test_utils.check_test_violations_count(fixture_assets, [iam_custom_role_permissions_allowlist_all], template_name, 0)
}

# Test denylist for all permissions
test_denylist_all {
	expected_resource_names := {
		"appengine.applications.get",
		"bigquery.config.get",
		"bigquery.config.update",
		"bigquery.datasets.create",
		"bigquery.datasets.delete",
		"bigquery.datasets.get",
		"cloudsql.instances.clone",
		"cloudsql.instances.create",
		"cloudsql.instances.delete",
		"cloudsql.instances.export",
		"cloudsql.instances.failover",
		"cloudsql.instances.get",
		"cloudsql.instances.getIamPolicy",
		"cloudsql.instances.import",
		"compute.disks.list",
		"compute.disks.resize",
		"compute.globalOperations.get",
		"compute.globalOperations.list",
		"compute.images.getFromFamily",
		"compute.images.list",
		"compute.images.setLabels",
		"datastore.entities.allocateIds",
		"datastore.entities.create",
		"datastore.entities.delete",
		"datastore.entities.get",
		"datastore.entities.list",
		"datastore.entities.update",
		"datastore.operations.delete",
		"datastore.operations.get",
		"datastore.operations.list",
		"datastore.statistics.get",
		"datastore.statistics.list",
		"resourcemanager.projects.get",
		"resourcemanager.projects.list",
	}

	test_utils.check_test_violations_metadata(fixture_assets, [iam_custom_role_permissions_denylist_all], template_name, "permission", expected_resource_names)
}

# Test that title name works with different caps case
test_title_caps {
	expected_resource_names := {
		"appengine.applications.get",
		"bigquery.config.get",
		"bigquery.config.update",
		"cloudsql.instances.clone",
		"cloudsql.instances.create",
		"cloudsql.instances.delete",
		"cloudsql.instances.export",
		"cloudsql.instances.failover",
		"cloudsql.instances.getIamPolicy",
		"cloudsql.instances.import",
		"compute.disks.list",
		"compute.disks.resize",
		"compute.globalOperations.get",
		"compute.globalOperations.list",
		"resourcemanager.projects.list",
	}

	test_utils.check_test_violations_metadata(fixture_assets, [iam_custom_role_permissions_title_caps], template_name, "permission", expected_resource_names)
}

# Test for wrong title name
test_title_wrong {
	test_utils.check_test_violations_count(fixture_assets, [iam_custom_role_permissions_wrong_title], template_name, 0)
}

# Test for no title
test_title_none {
	expected_resource_names := {
		"bigquery.config.get",
		"bigquery.jobs.list",
		"bigquery.models.list",
		"bigquery.readsessions.create",
		"bigquery.savedqueries.get",
		"bigquery.savedqueries.list",
		"appengine.applications.get",
		"bigquery.config.update",
		"cloudsql.instances.clone",
		"cloudsql.instances.create",
		"cloudsql.instances.delete",
		"cloudsql.instances.export",
		"cloudsql.instances.failover",
		"cloudsql.instances.getIamPolicy",
		"cloudsql.instances.import",
		"compute.disks.list",
		"compute.disks.resize",
		"compute.globalOperations.get",
		"compute.globalOperations.list",
		"resourcemanager.projects.list",
	}

	test_utils.check_test_violations_metadata(fixture_assets, [iam_custom_role_permissions_no_title], template_name, "permission", expected_resource_names)
}
