module "training_pipeline" {
  source = "../modules/vertexai-training-pipeline-setup"
  project_id = "vertex-ai-wf-9fa5"
  service_accounts = {
    "vertexai-service-account" = {
      project_roles = ["roles/aiplatform.admin"]
    }
  }
  bucket = {
    name = "vertexai_training_bucket"
    prefix = "dev"
    iam = {
      "roles/storage.admin" = [ "serviceAccount:vertexai-service-account@vertex-ai-wf-9fa5.iam.gserviceaccount.com" ]
    }
  }
}