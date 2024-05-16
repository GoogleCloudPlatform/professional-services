module "custom_constraints_factory" {
  source          = "./modules/organization"
  organization_id = var.organization_id

  factories_config = {
    # Make sure generated tf yaml constraints and policies files copied to factory data folder.
    # eg. data/custom-constraints
    org_policy_custom_constraints = "data/custom-constraints"
    org_policies                  = "data/custom-policies"
  }
}
