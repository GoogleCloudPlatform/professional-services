module "custom_constraints_factory" {
  source          = "./modules/organization"
  organization_id = var.organization_id

  factories_config = {
    org_policy_custom_constraints = "data/custom-constraints"
    org_policies                  = "data/custom-policies"
  }
}
