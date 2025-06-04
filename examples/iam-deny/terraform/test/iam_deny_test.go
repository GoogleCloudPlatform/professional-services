package test

import (
	"fmt"
	"reflect"
	"strings"
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
	tfjson "github.com/hashicorp/terraform-json"
	"github.com/stretchr/testify/assert"
)

func TestTerraformIamDenyPolicies(t *testing.T) {
	t.Parallel()

	exampleOrgID := "123456789012"
	exampleFolderID := "987654321098"

	terraformOptions := &terraform.Options{
		TerraformDir: "../",
		Vars: map[string]interface{}{
			"org_id":    exampleOrgID,
			"folder_id": exampleFolderID,
			"networking_exception_principals": []string{"group:net-admins@example.com"},
			"billing_exception_principals":    []string{"group:billing-admins@example.com"},
			"sec_exception_principals":        []string{"group:sec-admins@example.com"},
			"top_exception_principals":        []string{"group:org-admins@example.com"},
		},
		PlanFilePath: "tfplan.out",
	}

	planStruct := terraform.InitAndPlanAndShowWithStruct(t, terraformOptions)

	// --- Test top_level_deny Policy Structure ---
	t.Run("top_level_deny_policy_structure", func(t *testing.T) {
		topLevelDenyAddress := "google_iam_deny_policy.top_level_deny"
		_, ok := planStruct.ResourceChangesMap[topLevelDenyAddress]
		assert.True(t, ok, fmt.Sprintf("Resource %s not found in plan", topLevelDenyAddress))

		topLevelDeny := planStruct.ResourceChangesMap[topLevelDenyAddress]
		afterValue := topLevelDeny.Change.After
		t.Logf("Type of topLevelDeny.Change.After for %s: %s", topLevelDenyAddress, reflect.TypeOf(afterValue))

		afterMap, ok := afterValue.(map[string]interface{})
		if !assert.True(t, ok, "topLevelDeny.Change.After is not a map[string]interface{}") { t.FailNow() }

		expectedParentOrgFmt := "//cloudresourcemanager.googleapis.com/organizations/%s"
		expectedParentOrg := fmt.Sprintf(expectedParentOrgFmt, exampleOrgID)
		actualParentOrg, ok := afterMap["parent"].(string)
		if !assert.True(t, ok, "Parent field is not a string or does not exist") { t.FailNow() }
		assert.True(t, strings.HasSuffix(actualParentOrg, exampleOrgID) && strings.Contains(actualParentOrg, "organizations"),
			fmt.Sprintf("Parent for top_level_deny should be the organization ID %s, got %s", expectedParentOrg, actualParentOrg))

		rules, ok := afterMap["rules"].([]interface{})
		if !assert.True(t, ok, "rules field is not a slice or does not exist"){ t.FailNow() }
		if !assert.NotEmpty(t, rules, "Rules should not be empty for top_level_deny") { t.FailNow() }

		firstRule, ok := rules[0].(map[string]interface{})
		if !assert.True(t, ok, "First rule is not a map") { t.FailNow() }

		// deny_rule is a list containing one map
		denyRuleSlice, ok := firstRule["deny_rule"].([]interface{})
		if !assert.True(t, ok, "deny_rule is not a slice") { t.FailNow() }
		if !assert.Len(t, denyRuleSlice, 1, "deny_rule slice should have one element") { t.FailNow() }
		denyRule, ok := denyRuleSlice[0].(map[string]interface{})
		if !assert.True(t, ok, "deny_rule element is not a map") { t.FailNow() }

		denialConditionSlice, ok := denyRule["denial_condition"].([]interface{})
		if !assert.True(t, ok, "denial_condition is not a slice") {t.FailNow()}
		if !assert.Len(t, denialConditionSlice, 1, "denial_condition slice should have one element") {t.FailNow()}
		denialCondition, ok := denialConditionSlice[0].(map[string]interface{})
		if !assert.True(t, ok, "denial_condition element is not a map") {t.FailNow()}

		assert.Equal(t, "resource.matchTagId('tagKeys/*', 'tagValues/*')", denialCondition["expression"], "Denial condition expression mismatch for top_level_deny")

		deniedPrincipals, ok := denyRule["denied_principals"].([]interface{})
		if !assert.True(t, ok, "denied_principals is not a slice") { t.FailNow() }
		assert.Contains(t, deniedPrincipals, "principalSet://goog/public:all", "Denied principals should include all public for top_level_deny")

		assert.NotNil(t, denyRule["denied_permissions"], "denied_permissions should be set for top_level_deny")
	})

	// --- Test profile-deny-policy Structure ---
	t.Run("profile_deny_policy_structure", func(t *testing.T) {
		profileDenyAddress := "google_iam_deny_policy.profile-deny-policy"
		_, ok := planStruct.ResourceChangesMap[profileDenyAddress]
		assert.True(t, ok, fmt.Sprintf("Resource %s not found in plan", profileDenyAddress))
		profileDeny := planStruct.ResourceChangesMap[profileDenyAddress]

		afterValue := profileDeny.Change.After
		t.Logf("Type of profileDeny.Change.After for %s: %s", profileDenyAddress, reflect.TypeOf(afterValue))

		afterMap, ok := afterValue.(map[string]interface{})
		if !assert.True(t, ok, "profileDeny.Change.After is not a map[string]interface{}") { t.FailNow() }

		expectedParentFolderFmt := "//cloudresourcemanager.googleapis.com/folders/%s"
		expectedParentFolder := fmt.Sprintf(expectedParentFolderFmt, exampleFolderID)
		actualParentFolder, ok := afterMap["parent"].(string)
		if !assert.True(t, ok, "Parent field is not a string or does not exist in profileDeny") { t.FailNow() }
		assert.True(t, strings.HasSuffix(actualParentFolder, exampleFolderID) && strings.Contains(actualParentFolder, "folders"),
			fmt.Sprintf("Parent for profile_deny_policy should be the folder ID %s, got %s", expectedParentFolder, actualParentFolder))

		rules, ok := afterMap["rules"].([]interface{})
		if !assert.True(t, ok, "rules field is not a slice or does not exist in profileDeny"){ t.FailNow() }
		assert.Len(t, rules, 3, "Profile deny policy should have 3 rules (security, billing, networking)")

		expectedDenialConditionExpr := "!resource.matchTag('*/*', '*')"
		for _, ruleInterface := range rules {
			rule, ok := ruleInterface.(map[string]interface{})
			if !assert.True(t, ok, "Rule item is not a map") { continue }
			description, _ := rule["description"].(string)

			// deny_rule is a list containing one map
			denyRuleSlice, ok := rule["deny_rule"].([]interface{})
			if !assert.True(t, ok, fmt.Sprintf("deny_rule is not a slice for rule: %s", description)) { continue }
			if !assert.Len(t, denyRuleSlice, 1, fmt.Sprintf("deny_rule slice should have one element for rule: %s", description)) { continue }
			denyRule, ok := denyRuleSlice[0].(map[string]interface{})
			if !assert.True(t, ok, fmt.Sprintf("deny_rule element is not a map for rule: %s", description)) { continue }

			denialConditionSlice, ok := denyRule["denial_condition"].([]interface{})
			if !assert.True(t, ok, fmt.Sprintf("denial_condition is not a slice for rule: %s", description)) { continue }
			if !assert.Len(t, denialConditionSlice, 1, fmt.Sprintf("denial_condition slice should have one element for rule: %s", description)) { continue }
			denialCondition, ok := denialConditionSlice[0].(map[string]interface{})
			if !assert.True(t, ok, fmt.Sprintf("denial_condition element is not a map for rule: %s", description)) { continue }

			assert.Equal(t, expectedDenialConditionExpr, denialCondition["expression"], fmt.Sprintf("Denial condition expression mismatch for rule: %s", description))

			exceptionPrincipals, ok := denyRule["exception_principals"].([]interface{})
			if !assert.True(t, ok, fmt.Sprintf("exception_principals is not a slice for rule: %s", description)) { continue }
			assert.NotEmpty(t, exceptionPrincipals, fmt.Sprintf("Exception principals should not be empty for rule: %s", description))
		}
	})

	// --- Test Custom Org Policy deny_owner ---
	t.Run("custom_org_policy_deny_owner", func(t *testing.T) {
		customConstraintAddress := "google_org_policy_custom_constraint.deny_owner"
		_, ok := planStruct.ResourceChangesMap[customConstraintAddress]
		assert.True(t, ok, fmt.Sprintf("Resource %s not found in plan", customConstraintAddress))
		customConstraint := planStruct.ResourceChangesMap[customConstraintAddress]
		afterMapCustom, ok := customConstraint.Change.After.(map[string]interface{})
		if !assert.True(t, ok, "customConstraint.Change.After is not a map") {t.FailNow()}
		assert.Equal(t, "DENY", afterMapCustom["action_type"], "Custom constraint action_type should be DENY")
		assert.Contains(t, afterMapCustom["condition"], "roles/owner", "Custom constraint condition should mention roles/owner")

		enforcePolicyAddress := "google_org_policy_policy.enforce_deny_owner_constraint"
		_, ok = planStruct.ResourceChangesMap[enforcePolicyAddress]
		assert.True(t, ok, fmt.Sprintf("Resource %s not found in plan", enforcePolicyAddress))
		enforcePolicy := planStruct.ResourceChangesMap[enforcePolicyAddress]
		afterMapEnforce, ok := enforcePolicy.Change.After.(map[string]interface{})
		if !assert.True(t, ok, "enforcePolicy.Change.After is not a map") {t.FailNow()}
		expectedPolicyName := fmt.Sprintf("organizations/%s/policies/custom.denyOwner", exampleOrgID)
		assert.Equal(t, expectedPolicyName, afterMapEnforce["name"], "Org policy name mismatch")

		specSlice, ok := afterMapEnforce["spec"].([]interface{})
		if !assert.True(t, ok, "spec is not a slice") {t.FailNow()}
		if !assert.Len(t, specSlice, 1, "spec slice should have one element") {t.FailNow()}
		spec, ok := specSlice[0].(map[string]interface{})
		if !assert.True(t, ok, "spec element is not a map") {t.FailNow()}

		specRules, ok := spec["rules"].([]interface{})
		if !assert.True(t, ok, "spec.rules is not a slice") {t.FailNow()}
		if !assert.NotEmpty(t, specRules, "spec.rules should not be empty") {t.FailNow()}
		firstSpecRule, ok := specRules[0].(map[string]interface{})
		if !assert.True(t, ok, "First spec rule is not a map") {t.FailNow()}
		enforceValue := firstSpecRule["enforce"]
		assert.Equal(t, "TRUE", fmt.Sprintf("%v", enforceValue), "Org policy should be enforced (expecting 'TRUE')")
	})

	// --- Test Service Restriction Policy ---
	t.Run("service_restriction_policy", func(t *testing.T) {
		var foundModulePolicy *tfjson.ResourceChange
		for addr, rc := range planStruct.ResourceChangesMap {
			if strings.HasPrefix(addr, "module.gcp_org_policy_v2.") && rc.Type == "google_org_policy_policy" {
				foundModulePolicy = rc
				break
			}
		}
		assert.NotNil(t, foundModulePolicy, "No google_org_policy_policy found for module gcp_org_policy_v2")

		if foundModulePolicy != nil {
			afterMapModule, ok := foundModulePolicy.Change.After.(map[string]interface{})
			if !assert.True(t, ok, "Module policy .Change.After is not a map") {t.FailNow()}

			specSlice, ok := afterMapModule["spec"].([]interface{})
			if !assert.True(t, ok, "Module policy spec is not a slice") {t.FailNow()}
			if !assert.Len(t, specSlice, 1, "Module policy spec slice should have one element") {t.FailNow()}
			policySpec, ok := specSlice[0].(map[string]interface{})
			if !assert.True(t, ok, "Module policy spec element is not a map") {t.FailNow()}

			rules, ok := policySpec["rules"].([]interface{})
			if !assert.True(t, ok, "Module policy spec.rules is not a slice") {t.FailNow()}
			assert.True(t, len(rules) > 0, "Module's org policy should have rules")

			if len(rules) > 0 {
				rule, ok := rules[0].(map[string]interface{})
				if !assert.True(t, ok, "Module policy rule item is not a map") {t.FailNow()}

				valuesList, ok := rule["values"].([]interface{})
				if !assert.True(t, ok, "rule.values is not a list") {t.FailNow()}
				if !assert.Len(t, valuesList, 1, "rule.values list should have one element") {t.FailNow()}
				valuesMap, ok := valuesList[0].(map[string]interface{})
				if !assert.True(t, ok, "rule.values[0] is not a map") {t.FailNow()}

				deniedValues, ok := valuesMap["denied_values"].([]interface{})
				if !assert.True(t, ok, "values.denied_values is not a slice") {t.FailNow()}

				assert.Contains(t, deniedValues, "securitycenter.googleapis.com", "Denied services should include securitycenter.googleapis.com")
				assert.Contains(t, deniedValues, "accessapproval.googleapis.com", "Denied services should include accessapproval.googleapis.com")
			}
			constraint, ok := afterMapModule["name"].(string)
			if !assert.True(t, ok, "Module policy name is not a string") {t.FailNow()}
			assert.Contains(t, constraint, "gcp.restrictServiceUsage", "Module policy name should contain gcp.restrictServiceUsage")
		}
	})
}
