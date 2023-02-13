/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 * This file stores the queries for the Google Cloud Monitoring API.
 * 
 * NOTE: Apps Script only allows HTML or .gs files so there is no simple way to include a TOML or JSON file here.
 * Queries are originally from the queries.toml file below.
 * https://github.com/GoogleCloudPlatform/professional-services/blob/main/tools/capacity-planner-cli/queries.toml
*/

const QUERIES = {
  "bigtable": {
    "product_name": "Cloud BigTable",
    "metrics": {
      "egress": {
        "metric_name": "Egress MB/s",
        "query": "fetch bigtable_table\n | metric 'bigtable.googleapis.com/server/sent_bytes_count'\n | align rate(1m)\n |  every 1m\n |  group_by [], [value_sent_bytes_count_aggregate: aggregate(value.sent_bytes_count)]\n |  scale ('MiBy/s')"
      },
      "ingress": {
        "metric_name": "Ingress MB/s",
        "query": "fetch bigtable_table\n |  metric 'bigtable.googleapis.com/server/received_bytes_count'\n |  align rate(1m)\n |  every 1m\n |  group_by [], [value_received_bytes_count_aggregate: aggregate(value.received_bytes_count)]\n |  scale ('MiBy/s')"
      },
      "qps": {
        "metric_name": "QPS",
        "query": "fetch bigtable_table\n |  metric 'bigtable.googleapis.com/server/request_count'\n |  align rate(1m)\n |  every 1m\n |  group_by [], [value_request_count_aggregate: aggregate(value.request_count)]"
      }
      }
  },
  "cdn": {
    "product_name": "Cloud CDN",
    "metrics": {
      "egress": {
        "metric_name": "Egress Gbps",
        "query": "fetch https_lb_rule\n |  metric 'loadbalancing.googleapis.com/https/response_bytes_count'\n |  filter (metric.cache_result != 'DISABLED')\n |  align rate(1m)\n |  every 1m\n |  group_by [], [value_response_bytes_count_aggregate: aggregate(value.response_bytes_count)]\n |  scale ('Gibit/s')"
      },
      "qps": {
        "metric_name": "QPS",
        "query": "fetch https_lb_rule\n |  metric 'loadbalancing.googleapis.com/https/request_count'\n |  filter (metric.cache_result != 'DISABLED')\n |  align rate(1m)\n |  every 1m\n |  group_by [resource.region],\n        [value_requst_count_aggregate: aggregate(value.request_count)]"
      }
    }
  },
  "gcs": {
    "product_name": "Cloud Storage",
    "metrics": {
      "egress": {
        "metric_name": "Egress MiB/s",
        "query": "fetch gcs_bucket\n |  metric 'storage.googleapis.com/network/sent_bytes_count'\n |  align rate(1m)\n |  every 1m\n |  group_by [resource.location], [value_sent_bytes_count_aggregate: aggregate(value.sent_bytes_count)]\n |  scale ('MiBy/s')"
      },
      "qps": {
        "metric_name": "QPS",
        "query": "fetch gcs_bucket\n |  metric 'storage.googleapis.com/api/request_count'\n |  align rate(1m)\n |  every 1m\n |  group_by [resource.location], [value_request_count_aggregate: aggregate(value.request_count)]"
      }
    }
  },
  "l4xlb": {
    "product_name": "TCP/UDP Load Balancing",
    "metrics": {
      "egress": {
        "metric_name": "Egress Gbps",
        "query": "fetch tcp_lb_rule\n |  metric 'loadbalancing.googleapis.com/l3/external/egress_bytes_count'\n |  align rate(1m)\n |  every 1m\n |  group_by [resource.region], [value_egress_bytes_count_aggregate: aggregate(value.egress_bytes_count)]\n |  scale ('Gibit/s')"
      },
      "ingress": {
        "metric_name": "Ingress Gbps",
        "query": "fetch tcp_lb_rule\n |  metric 'loadbalancing.googleapis.com/l3/external/ingress_bytes_count'\n |  align rate(1m)\n |  every 1m\n |  group_by [resource.region], [value_ingress_bytes_count_aggregate: aggregate(value.ingress_bytes_count)]\n |  scale ('Gibit/s')"
      }
    }
  },
  "l7xlb": {
    "product_name": "HTTP(S) Load Balancing",
    "metrics": {
      "egress": {
        "metric_name": "Egress Gbps",
        "query": "fetch https_lb_rule\n |  metric 'loadbalancing.googleapis.com/https/response_bytes_count'\n |  align rate(1m)\n |  every 1m\n |  group_by [resource.region], [value_response_bytes_count_aggregate: aggregate(value.response_bytes_count)]\n |  scale('Gibit/s')"
      },
      "ingress": {
        "metric_name": "Ingress Gbps",
        "query": "fetch https_lb_rule\n |  metric 'loadbalancing.googleapis.com/https/request_bytes_count'\n |  align rate(1m)\n |  every 1m\n |  group_by [resource.region], [value_requst_bytes_count_aggregate: aggregate(value.request_bytes_count)]\n |  scale('Gibit/s')"
      },
      "qps": {
        "metric_name": "QPS",
        "query": "fetch https_lb_rule\n |  metric 'loadbalancing.googleapis.com/https/request_count'\n |  align rate(1m)\n |  every 1m\n |  group_by [resource.region], [value_requst_count_aggregate: aggregate(value.request_count)]"
      }
    }
  },
  "pubsub": {
    "product_name": "Cloud Pub/Sub",
    "metrics": {
      "pub_avg_msg_size": {
        "metric_name": "Publisher Average Message Size",
        "query": "fetch pubsub_topic\n |  metric 'pubsub.googleapis.com/topic/message_sizes'\n |  align delta(1m)\n |  every 1m\n |  group_by [resource.topic_id], [value_message_sizes_mean: mean(value.message_sizes)]\n |  scale('By')"
      },
      "pub_mbps": {
        "metric_name": "Publisher Throughput GB/s",
        "query": "fetch pubsub_topic\n |  metric 'pubsub.googleapis.com/topic/byte_cost'\n |  align rate(1m)\n |  every 1m\n |  group_by [resource.topic_id], [value_byte_cost_aggregate: aggregate(value.byte_cost)]\n |  scale ('GiBy/s')"
      },
      "pub_qps": {
        "metric_name": "Publisher QPS",
        "query": "fetch pubsub_topic\n |  metric 'pubsub.googleapis.com/topic/send_request_count'\n |  align rate(1m)\n |  every 1m\n |  group_by [resource.topic_id], [value_send_request_count_aggregate: aggregate(value.send_request_count)]"
      },
      "sub_mbps": {
        "metric_name": "Subscriber Throughput GB/s",
        "query": "fetch pubsub_subscription\n |  metric 'pubsub.googleapis.com/subscription/byte_cost'\n |  align rate(1m)\n |  every 1m\n |  group_by [resource.subscription_id], [value_byte_cost_aggregate: aggregate(value.byte_cost)]\n |  scale ('GiBy/s')"
      },
      "sub_pull_qps": {
        "metric_name": "Subscriber Pull QPS",
        "query": "fetch pubsub_subscription\n |  metric 'pubsub.googleapis.com/subscription/pull_request_count'\n |  align rate(1m)\n |  every 1m\n |  group_by [resource.subscription_id], [value_pull_request_count_aggregate: aggregate(value.pull_request_count)]"
      },
      "sub_strpull_qps": {
        "metric_name": "Subscriber Streaming Pull QPS",
        "query": "fetch pubsub_subscription\n |  metric 'pubsub.googleapis.com/subscription/streaming_pull_response_count'\n |  align rate(1m)\n |  every 1m\n |  group_by [resource.subscription_id], [value_streaming_pull_response_count_aggregate: aggregate(value.streaming_pull_response_count)]"
      }
    }
  },
  "spanner": {
    "product_name": "Cloud Spanner",
    "metrics": {
      "qps": {
        "metric_name": "QPS",
        "query": "fetch spanner_instance\n |  metric 'spanner.googleapis.com/api/api_request_count'\n |  align rate(1m)\n |  every 1m\n |  group_by [], [value_api_request_count_aggregate: aggregate(value.api_request_count)]"
      }
    }
  }
}