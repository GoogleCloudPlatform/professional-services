# # Docs: 
# # Feature store: https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/vertex_ai_featurestore
# # Entity Type: https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/vertex_ai_featurestore_entitytype
# # Feature: https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/vertex_ai_featurestore_entitytype_feature

module "vertexai-featurestore" {
  source = "../modules/vertexai-featurestore"
  project = "vertex-ai-wf-9fa5"
  providers = {
    google-beta = google-beta
   }
  featurestore = {
    "test_featurestore" = {
        "name" = "movie_featurestore"
        "labels"  = {
            "label1" = "value1"
        }
        "region" = "us-central1"
        "online_serving_config" = {
            "fixed_node_count" = 1 
        }
        "entities" = [
          {
            "name" = "name"
            "labels" = {
              "label1" = "value1"
            }
            "monitoring_config" = {
              "snapshot_analysis" = {
                "disabled" = false
                "monitoring_interval" = "86400s"
              }
            }
            "features" = [
              {
                "name" = "name"
                "labels" = {
                  "label1" = "value1"
                }
                "value_type"  = "INT64_ARRAY"
              }
            ]
          },
          {
            "name" = "rating"
            "labels" = {
              "label1" = "value1"
            }
            "monitoring_config" = {
              "snapshot_analysis" = {
                "disabled" = false
                "monitoring_interval" = "86400s"
              }
            }
            "features" = [
              {
                "name" = "name"
                "labels" = {
                  "label1" = "value1"
                }
                "value_type"  = "INT64_ARRAY"
              }
            ]
          },
          {
            "name" = "created_time"
            "labels" = {
              "label1" = "value1"
            }
            "monitoring_config" = {
              "snapshot_analysis" = {
                "disabled" = false
                "monitoring_interval" = "86400s"
              }
            }
            "features" = [
              {
                "name" = "name"
                "labels" = {
                  "label1" = "value1"
                }
                "value_type"  = "INT64_ARRAY"
              }
            ]
          }
        ]
    }
    "test_featurestore_2" = {
        "name" = "car_featurestore"
        "labels"  = {
            "label1" = "value1"
        }
        "region" = "us-central1"
        "online_serving_config" = {
            "fixed_node_count" = 1 
        }
        "entities" = [
          {
            "name" = "name"
            "labels" = {
              "label1" = "value1"
            }
            "monitoring_config" = {
              "snapshot_analysis" = {
                "disabled" = false
                "monitoring_interval" = "86400s"
              }
            }
            "features" = [
              {
                "name" = "name"
                "labels" = {
                  "label1" = "value1"
                }
                "value_type"  = "INT64_ARRAY"
              }
            ]
          }
        ]
    }
  }
}
