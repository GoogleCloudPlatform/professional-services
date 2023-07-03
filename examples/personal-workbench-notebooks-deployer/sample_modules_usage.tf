module "sample-user-managed-module" {
  source                                  = "./modules/personal-user-managed-notebook"
  notebook_users_list                     = ["testuser1@oscartests.joonix.net"]
  dataproc_yaml_template_file_name        = "per-auth-cluster.yaml"
  personal_dataproc_notebooks_bucket_name = "personal_dataproc_notebooks"
  user_managed_instance_prefix            = "user-managed-instance"
  generated_templates_path_name           = "dataproc_generated_templates"
  master_templates_path_name              = "dataproc_master_templates"
  project_id                              = "test-perms-prj"
}

module "sample-managed-module" {
  source                  = "./modules/personal-managed-notebook"
  notebook_users_list     = ["testuser1@oscartests.joonix.net"]
  managed_instance_prefix = "managed-instance"
  project_id              = "test-perms-prj"
}