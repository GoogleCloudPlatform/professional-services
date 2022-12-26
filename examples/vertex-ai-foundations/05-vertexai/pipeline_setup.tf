module "vertexai-pipeline-setup" {
  source     = "../modules/vertexai-pipeline-setup"
  project_id = "project"
  pipeline_runners = ["user:username@google.com"]
  bucket_name = "vertexsandbox-pipeline-bucket"
}
