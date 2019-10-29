# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Script to migrate from old slo.json format (Stackdriver only) to new format
# flake8: noqa
import json


def migrate_json(filepath=None, data=None):
    """Migrate old config format to new config format.

    Args:
        filepath (str): File path for old config.
    """
    if filepath:
        old_config = json.load(open(filepath, 'r'))
    elif data:
        old_config = data

    config = {
        "name": old_config["slo_name"],
        "service_name": old_config["service_name"],
        "feature_name": old_config["feature_name"],
        "target": old_config["slo_target"],
        "exporters": [{
            "class": "PubSub",
            "project_id": old_config["slo_achievement_project_id"],
            "topic_name": old_config["slo_achievement_topic_name"]
        }],
        "backend": {
            "class": "Stackdriver",
            "project_id": old_config["stackdriver_host_project_id"],
            "method": old_config["measurement"]["slo_type"].replace("-", "_"),
            "measurement": {}
        }
    }

    measurement = old_config["measurement"]
    if measurement["slo_type"] == 'exponential-distribution-cut':
        config["backend"]["measurement"]["threshold_bucket"] = \
            measurement["cut_after_bucket_number"]
        config["backend"]["measurement"]["good_below_threshold"] = \
            measurement["good_is_below_cut"]
        config["backend"]["measurement"]["filter_valid"] = \
            measurement["filter_valid"]
    elif measurement["slo_type"] == 'good-bad-ratio':
        config["backend"]["measurement"]["filter_good"] = \
            measurement["filter_good"]
        config["backend"]["measurement"]["filter_bad"] = \
            measurement["filter_bad"]

    # pprint.pprint(config)

    if filepath:
        with open(filepath.rstrip('.json') + '_new.json', 'w') as f:
            f.write(json.dumps(config))

    return config


OLD_1 = {
    "service_name": "datapipelines",
    "feature_name": "gcs2bq",
    "slo_name": "throughput",
    "slo_target": 0.9,
    "stackdriver_host_project_id": "brunore-stackdriver-host-project",
    "slo_achievement_project_id": "brunore-stackdriver-test",
    "slo_achievement_topic_name": "slo-achievement",
    "measurement": {
        "backend":
            "Stackdriver",
        "slo_type":
            "exponential-distribution-cut",
        "cut_after_bucket_number":
            31,
        "good_is_below_cut":
            False,
        "filter_valid":
            "project=\"brunore-gaestd-test\" AND metric.type=\"custom.googleapis.com/datapipeline/throughput\" AND metric.labels.pipeline_category = \"gcs2bq\""
    }
}

NEW_1 = {
    "name": "throughput",
    "target": 0.9,
    "service_name": "datapipelines",
    "feature_name": "gcs2bq",
    "exporters": [{
        "class": "PubSub",
        "project_id": "brunore-stackdriver-test",
        "topic_name": "slo-achievement"
    }],
    "backend": {
        "class": "Stackdriver",
        "method": "exponential_distribution_cut",
        "project_id": "brunore-stackdriver-host-project",
        "measurement": {
            "threshold_bucket":
                31,
            "good_below_threshold":
                False,
            "filter_valid":
                "project=\"brunore-gaestd-test\" AND metric.type=\"custom.googleapis.com/datapipeline/throughput\" AND metric.labels.pipeline_category = \"gcs2bq\""
        }
    }
}

OLD_2 = {
    "service_name": "datapipelines",
    "feature_name": "teradata2bq",
    "slo_name": "availability",
    "slo_target": 0.99,
    "stackdriver_host_project_id": "brunore-stackdriver-host-project",
    "slo_achievement_project_id": "brunore-stackdriver-test",
    "slo_achievement_topic_name": "slo-achievement",
    "measurement": {
        "slo_type":
            "good-bad-ratio",
        "filter_good":
            "project=\"brunore-gaestd-test\" AND metric.type=\"custom.googleapis.com/datapipeline/job_count\" AND metric.labels.metric_purpose = \"availability\" AND metric.labels.pipeline_category = \"teradata2bq\" AND metric.labels.event_type = \"good\"",
        "filter_bad":
            "project=\"brunore-gaestd-test\" AND metric.type=\"custom.googleapis.com/datapipeline/job_count\" AND metric.labels.metric_purpose = \"availability\" AND metric.labels.pipeline_category = \"teradata2bq\" AND metric.labels.event_type = \"bad\""
    }
}

NEW_2 = {
    "name": "availability",
    "target": 0.99,
    "service_name": "datapipelines",
    "feature_name": "teradata2bq",
    "exporters": [{
        "class": "PubSub",
        "project_id": "brunore-stackdriver-test",
        "topic_name": "slo-achievement"
    }],
    "backend": {
        "class": "Stackdriver",
        "project_id": "brunore-stackdriver-host-project",
        "method": "good_bad_ratio",
        "measurement": {
            "filter_good":
                "project=\"brunore-gaestd-test\" AND metric.type=\"custom.googleapis.com/datapipeline/job_count\" AND metric.labels.metric_purpose = \"availability\" AND metric.labels.pipeline_category = \"teradata2bq\" AND metric.labels.event_type = \"good\"",
            "filter_bad":
                "project=\"brunore-gaestd-test\" AND metric.type=\"custom.googleapis.com/datapipeline/job_count\" AND metric.labels.metric_purpose = \"availability\" AND metric.labels.pipeline_category = \"teradata2bq\" AND metric.labels.event_type = \"bad\""
        }
    }
}


def deep_eq(d1, d2):
    dump1 = json.dumps(d1, sort_keys=True)
    dump2 = json.dumps(d2, sort_keys=True)
    return dump1 == dump2


if __name__ == '__main__':
    assert (deep_eq(migrate_json(data=OLD_1), NEW_1))
    assert (deep_eq(migrate_json(data=OLD_2), NEW_2))
