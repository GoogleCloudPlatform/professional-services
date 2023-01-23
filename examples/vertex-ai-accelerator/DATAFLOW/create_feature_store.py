from google.cloud.aiplatform import Feature, Featurestore
import apache_beam as beam
import logging      
    

FEATURESTORE_ID="mlops_experiment_feature_store"
ONLINE_STORE_FIXED_NODE_COUNT=1
PROJECT_ID="mlops-experiment-v2"
REGION="us-central1"
try:
    fs = Featurestore.create(
                featurestore_id=FEATURESTORE_ID,
                online_store_fixed_node_count=ONLINE_STORE_FIXED_NODE_COUNT,
                project=PROJECT_ID,
                location=REGION,
                sync=True,
            )

    graph_entity_type = fs.create_entity_type(
                    entity_type_id="graph",
                    description="Graph entity",
        )

    graph_feature_configs = {
            "feature_id": {
                "value_type": "INT64",
                "description": "feature_id",
            },
            "location_source": {
                "value_type": "STRING",
                "description": "location_source",
            },
            "location_destination": {
                "value_type": "STRING",
                "description": "LOCATION_DESTINATION",
            },
            "feature_1_score": {
                "value_type": "DOUBLE",
                "description": "Graph feature value",
            },
            "feature_2_score": {
                "value_type": "DOUBLE",
                "description": "Graph feature value",
            },
            "feature_3_score": {
                "value_type": "DOUBLE",
                "description": "Graph feature value",
            }, 
            "feature_4_score": {
                "value_type": "DOUBLE",
                "description": "Graph feature value",
            },
            "feature_5_score": {
                "value_type": "DOUBLE",
                "description": "Graph feature value",
            },
            "feature_6_score": {
                "value_type": "DOUBLE",
                "description": "Graph feature value",
            },
            "feature_7_score": {
                "value_type": "DOUBLE",
                "description": "Graph feature value",
            }, 
            "feature_8_score": {
                "value_type": "DOUBLE",
                "description": "Graph feature value",
            }, 
            "feature_9_score": {
                "value_type": "DOUBLE",
                "description": "Graph feature value",
            }, 
            "feature_10_score": {
                "value_type": "DOUBLE",
                "description": "Graph feature value",
            },
            "link_predict": {
                "value_type": "BOOL",
                "description": "Target value",
            }
        }

    graph_features = graph_entity_type.batch_create_features(
                feature_configs=graph_feature_configs,
            )
except Exception as e:
    logging.info('FEATURE STORE is exists.')