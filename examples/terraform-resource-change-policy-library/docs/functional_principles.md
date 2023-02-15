# Functional Principles of the Constraint Framework

You'll notice that this repository contains a handful of folders, each with different items. It's confusing at first, so let's dive into it! First, let's start with how the library is organized.

## Folder Structure

The folder structure below contains a TL;DR explanation of each item's purpose. We'll go into further detail below.

```(bash)
policy-library-tf-resource-change (root)/
├── docs/
│   └── *Contains documentation on this library*
├── lib/
│   └── *Contains shared rego functions*
├── policies/
│   ├── constraints/
│   │   └── *Contains constraint yaml files*
│   └── templates/
│       └── *Contains constraint template yaml files*
├── samples/
│   └── constraints/
│       └── *Contains sample constraint yaml files (not checked at runtime)*
├── scripts/
│   └── *Contains helper scripts to assist with policy development*
├── validator/
│   ├── *Contains rego policies (used in constraint template yaml files)*
│   ├── *files ending in `*_test.rego` are base unit testing files for their associated rego policies*
│   └── test/
│       └── *Contains test data/constraints used for unit testing*
└── Makefile *Allows user to use `make ...` commands for policy development*
```

## Basic Operation

When you run `gcloud beta terrafor vet`, a number of things happen. First, the resource being tested (ie. Your terraform plan json file) is translated from its native Terraform schema to Cloud Asset Inventory (CAI) schema. Keep in mind that the data being passed in is exactly the same, it's just translated into a language that the validator can understand. Because the validator is also set up to perform ongoing policy validation on the environment, all resources are cast into the CAI schema to bring all data together. Don't be alarmed, however, our constraints and constraint templates are reworked to tell the validator to *only* look at terraform resource changes. We'll explore how that happens later on.

Once the data is in CAI format, `gcloud beta terraform vet` then initializes the constraints and templates in your policy library. Let's look at what each type of yaml file contains:

| Type | Description |
| -- | -- |
| ConstraintTemplate | Describes how to integrate logic from a rego policy into rules that the validator checks. This file will describe how constraints that use it should be configured, and also provides the rego policy as an inlined yaml string field. You'll also notice the `target` definition, which reads as `validation.resourcechange.terraform.cloud.google.com`. This is the main difference between this policy library and the [existing CAI policy library](https://github.com/GoogleCloudPlatform/policy-library). **This is the part of the library that allows us to target terraform resource changes and skip current environment monitoring.** Ultimately, think of ConstraintTemplates as definitions that our corresponding constraint(s) must abide by. |
| Constraint | Implements single rules that depend on a constraint template. Remember that constraint templates contain a schema that describes how to write constraints that depend on them. The actual constraint will contain the data that you'll be looking to test. For example, if you want to validate that terraform only creates IAM bindings, you would create a constraint that passes in the *mode* `allowlist`, and a list of `members` (domains, in this case) that terraform is allowed to create. The constraint tells the validator to fail the pipeline if terraform tries to bind an IAM role to a user ouside of the domain(s) you've passed in. <br /><br /> You can create multiple constraints for any given ConstraintTemplate, you just need to make sure that the rules don't conflict with one another. For example, any allowlist/denylist policy would be difficult to create multiple constraints for. The reason is that if one constraint is of type `allowlist` and the other is of type `denylist`, it's very easy to introduce overlaps in the sets that you create. By this logic, if *domain-a.com* is not a part of your policy member domain allowlist or denylist constraints, it'll automatically be denied. This is because allowlists are more inclusive than denylists, and any domain not in an allowlist will be denied. Just because it's not denied in the denylist, it will be denied by the allowlist. |

If this is still confusing to you, the [Gatekeeper docuemntation](https://github.com/GoogleCloudPlatform/policy-library) provides a detailed explanation of how Constraints and ConstraintTemplates work together. Yes, Gatekeeper is generally synonymous with Kubernetes resources, but it's simply an extension of Open Policy Agent. We use gatekeeper's API in the terraform validator, and it's how the tool is able to interpret policies from the policy library.

## Developing Terraform Constraints

In order to develop new policies, you must first understand the process for writing rego policies and how the constraint framework is used. The very first step is to collect some sample data. erraform-based constraints operate on **resource change data**, which comes from the `resource_changes` key of [Terraform plan JSON.](https://developer.hashicorp.com/terraform/internals/json-format) This will be an array of objects that describe changes that terraform will try to make to the target environment. Here's an example that comes directly from one of the data files used in one of the unit tests in this library.

```(json)
 "resource_changes": [
        {
            "address": "google_project_iam_binding.iam-service-account-user-12345",
            "mode": "managed",
            "type": "google_project_iam_binding",
            "name": "iam-service-account-user-12345",
            "provider_name": "registry.terraform.io/hashicorp/google",
            "change": {
                "actions": [
                    "create"
                ],
                "before": null,
                "after": {
                    "condition": [],
                    "members": [
                        "serviceAccount:service-12345@notiam.gserviceaccount.com",
                        "user:bad@notgoogle.com"
                    ],
                    "project": "12345",
                    "role": "roles/iam.serviceAccountUser"
                },
                "after_unknown": {
                    "condition": [],
                    "etag": true,
                    "id": true,
                    "members": [
                        false,
                        false
                    ]
                },
                "before_sensitive": false,
                "after_sensitive": {
                    "condition": [],
                    "members": [
                        false,
                        false
                    ]
                }
            }
        },
        [...]
    ]
```

You can start to see the schema of each resource, which will help us with the next step. It's time to write the Rego policy, which you can put under the `validator/` folder in the project.

Note that Rego policies for terraform resource changes are slightly different than their CAI counterparts. Let's go through a sample policy that allows us to allowlist/denylist certain IAM roles:

```(rego)
package templates.gcp.TFGCPIAMAllowBanRolesConstraintV1

violation[{
 "msg": message,
 "details": metadata,
}] {
 params := input.parameters
 resource := input.review
 resource.type == "google_project_iam_binding"
 not resource.change.actions[0] == "delete"
 role := resource.change.after.role
 matches_found = [r | r := config_pattern(role); glob.match(params.roles[_], [], r)]
 mode := object.get(params, "mode", "allowlist")
 target_match_count(mode, desired_count)
 count(matches_found) != desired_count
 message := output_msg(desired_count, resource.name, role)
 metadata := {
  "resource": resource.name,
  "role": role,
 }
}
target_match_count(mode) = 0 {
 mode == "denylist"
}
target_match_count(mode) = 1 {
 mode == "allowlist"
}
output_msg(0, asset_name, role) = msg {
 msg := sprintf("%v is in the banned list of IAM policy for %v", [role, asset_name])
}
output_msg(1, asset_name, role) = msg {
 msg := sprintf("%v is NOT in the allowed list of IAM policy for %v", [role, asset_name])
}
config_pattern(old_pattern) = "**" {
 old_pattern == "*"
}
config_pattern(old_pattern) = old_pattern {
 old_pattern != "*"
}
```

There are two parts to this policy. We have a `violation` object, which contains line-by-line logic statements. The way rego works is that the policy will run line-by-line, and will `break` if any of the conditions don't pass. For instance, if the `resource.type` is **not** "google_project_iam_binding", the rest of the rule will not be checked, and no violation gets reported. If you're familiar with Golang syntax, a `:=` means *set the variable equal to the value on the right side (declaration, assignment, and redeclaration)*. A `==` means *check the equality of the left and right side*. A `=` is for assignment **only**, meaning that it won't infer the type of the variable. It can be used outside of functions of violations, however.

The violation object will run with every `input.review` object (which is each object in the `resource_changes` array, evaluated one at a time). `input.parameters` will always be the same, as it contains the information passed in the `parameters` section of the constraint (AHA! That's why we use the constraint framework!). In the case of this policy, if the number of matches we get between the input object and the constraint does not match the desired count (determined by whether the mode of the constraint is `allowlist` or `denylist`), the `violation` will spit out a violation message, and an object containing metadata.

The second part of the policy is for functions that the policy uses in the violation. You'll see duplicates, like `target_match_count`, for example. These duplicative functions allow us to return a different value based on the input. In the case of `target_match_count`, if the mode is of type `*denylist`, it will return a `0`. So, if we end up getting one hit between our `input.review` object, the actual count **will not** equal our desired count, and the violation will trigger, and send a violation message to stdout.

### Inlining Rego Policies

This is the easiest part of the development process. Once you've created a new policy, if you've cloned this repo, simply run `make build` to inline the policy into its accompanying constraint template. Remember the first line of the rego policy? `package templates.gcp.TFGCPIAMAllowBanRolesConstraintV1`? You'll need to make sure that you create a constraint template with the `kind` property under spec->crd->spec->names->kind set to `TFGCPIAMAllowBanRolesConstraintV1`. You can see this, and other details, in the ConstraintTemplate that accompanys this policy:

```(yaml)
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: tfgcpiamallowbanrolesconstraintv1
spec:
  crd:
    spec:
      names:
        kind: TFGCPIAMAllowBanRolesConstraintV1
      validation:
        openAPIV3Schema:
          properties:
            mode:
              description: "Enforcement mode, defaults to allow"
              type: string
              enum: [denylist, allowlist]
            roles:
              description: "Roles to be allowed or banned
                ex. roles/owner; Wildcards (*) supported"
              type: array
              items:
                type: string
  targets:
    - target: validation.resourcechange.terraform.cloud.google.com
      rego: |
        #INLINE("validator/my_rego_rule.rego")
        ... (rego code)
        #ENDINLINE
```

You can see that the ConstraintTemplate defines a set of properties that constraints built from this template must abide by. Look at a constraint that uses this template to get a better idea of how the two interract:

```(yaml)
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: TFGCPIAMAllowBanRolesConstraintV1
metadata:
  name: iam-allow-roles
  annotations:
    description: Allow only the listed IAM role bindings to be created. This
      constraint is member-agnostic.
spec:
  severity: high
  match:
    target: # {"$ref":"#/definitions/io.k8s.cli.setters.target"}
      - "organizations/**"
    exclude: [] # optional, default is no exclusions
  parameters:
    mode: "allowlist"
    roles:
      - "roles/logging.viewer"
      - "roles/resourcemanager.projectIamAdmin"
```

Notice that the constraint defines a set of parameters, including `mode` and `roles`. If you look at the ConstraintTempalte, you can see that these two fields are defined and described. `Mode` is a string enumerable that *must* be either denylist or allowlist. `gcloud beta terraform vet` will actually error out if this is not upheld in the associated constraint(s).

## Additional Resources

Documentation on the Constraint Framework and `gcloud beta terraform vet` is pretty widespread, but this document provides some application-specific information for using the `validation.resourcechange.terraform.cloud.google.com` target for validating terraform resource changes. Documentation on this use case does exist, and can be found [here](https://cloud.google.com/docs/terraform/policy-validation/create-terraform-constraints).

When it comes time to create your own rego policies, I also recommend using the [Rego Playground](https://play.openpolicyagent.org/) to first get a hang of the Rego language. Developing Rego in a local environment is really challenging, as debugging and tracing features must be integrated manually, usually with a log statement, like `trace(sprintf("Value: %s", [value]))`. However, the very nature of how Rego runs makes this extremely challenging, becasue if your violation exits before you even get to a log line, the trace will never be printed to stdout, and you won't easily be able to see what's going wrong in your policies.

In my early development of this policy library, I created a couple of playgrounds in order to get a hang of Rego. Here's [an example](https://play.openpolicyagent.org/p/HzzUikhvQ4) of that, where I tested the logic for validating permissions on IAM Custom Roles. Take a look if you're interested! Although keep in mind that this wouldn't work if brought into the policy library, as this policy is unsuported by the Gatekeeper v1beta1 API Version. You would need to change the `deny` rule to `violation` and use updated Rego built-ins, like `object.get` instead of `get_default()`. For me, the output gave me helpful hints on what was wrong with my rules and utility functions.

## Contact Info

Questions or comments? Please contact tdesrosi@google.com for this project, or validator-support@google.com for information about the terraform-validator project.
