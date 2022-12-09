
locals {
  entities = flatten([
    for featurestore_key, featurestore in var.featurestore : [
      for entity_key, entity in featurestore.entities : {
        featurestore_key  = featurestore_key
        entity_key        = entity_key
        featurestore_id   = google_vertex_ai_featurestore.featurestore[featurestore_key].id
        name              = entity.name
        labels            = entity.labels
        monitoring_config = {
          snapshot_analysis = entity.monitoring_config.snapshot_analysis
        }
      }
    ]
  ])
  features = flatten([
    for featurestore_key, featurestore in var.featurestore : [
      for entity_key, entity in featurestore.entities : [
        for feature_key, feature in entity.features : {
          featurestore_key  = featurestore_key
          entity_key        = entity_key
          feature_key       = feature_key
          entity_id         = google_vertex_ai_featurestore_entitytype.entity["${entity_key}.${featurestore_key}"].id
          name              = feature.name
          labels            = feature.labels
          value_type        = feature.value_type
        }
      ]
    ]
  ])
  depends_on = [google_vertex_ai_featurestore.featurestore]
}

# Featurestore
resource "google_vertex_ai_featurestore" "featurestore" {
  provider = google-beta
  for_each = var.featurestore

  name     = each.value.name
  labels   = each.value.labels
  region   = each.value.region
  project  = var.project
  dynamic "online_serving_config"{
    for_each = each.value.online_serving_config == null ? [] : [""]
    content {
        fixed_node_count = each.value.online_serving_config.fixed_node_count #Enables online serving 
    }
  }
}

# EntityType monitoring the Featurestore
resource "google_vertex_ai_featurestore_entitytype" "entity" {
  provider = google-beta
  for_each = {
    for entity in local.entities : "${entity.entity_key}.${entity.featurestore_key}" => entity
  }

  name         = each.value.name
  labels       = each.value.labels
  featurestore = each.value.featurestore_id
  # dynamic "monitoring_config" {
  #   for_each   = each.value.monitoring_config == null ? [] :[""]
  #   content {
  #       snapshot_analysis = each.value.monitoring_config.snapshot_analysis
  #   }
  # }
}

# Feature Integer sitting inside the EntityType
resource "google_vertex_ai_featurestore_entitytype_feature" "feature" {
  provider = google-beta
  for_each = {
    for feature in local.features : "${feature.entity_key}.${feature.featurestore_key}.${feature.feature_key}" => feature
  }

  name       = each.value.name
  labels     = each.value.labels
  entitytype = each.value.entity_id
  value_type = each.value.value_type
}