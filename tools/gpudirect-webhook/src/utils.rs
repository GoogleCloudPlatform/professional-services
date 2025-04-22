// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

use crate::Args;
use crate::config::{GpuDirectType, MachineConfig};
use crate::constants::{COMPUTE_ENDPOINT, CONTAINER_ENDPOINT};
use anyhow::anyhow;
use clap::Parser;
use k8s_openapi::api::core::v1::{EnvVar, Pod, ResourceRequirements};
use kube::core::DynamicObject;
use kube::{Api, ResourceExt};
use log::{debug, info, warn};
use regex::Regex;
use reqwest::header::ACCEPT;
use serde_json::{Value, json};
use std::collections::{BTreeMap, HashMap};
use std::time::Duration;

pub(crate) async fn wait_for_op(
    project: &String,
    auth_token: &String,
    region: Option<&String>,
    endpoint: &str,
    res: &Value,
) -> anyhow::Result<()> {
    let mut retries = 4;
    if let Some(operation_id) = res["id"].as_str() {
        while retries != 0 {
            let mut endpoint = format!(
                "{}/v1/projects/{}/global/operations/{}/wait",
                endpoint, &project, operation_id
            );
            let mut payload = json!({
                "project": project,
                "operation": operation_id
            });
            if let Some(r) = region {
                endpoint = format!(
                    "{}/v1/projects/{}/regions/{}/operations/{}/wait",
                    endpoint, &project, r, operation_id
                );
                payload = json!({
                    "project": project,
                    "region": region,
                    "operation": operation_id
                });
            }
            let res = reqwest::Client::new()
                .post(endpoint)
                .header(ACCEPT, "application/json")
                .bearer_auth(auth_token)
                .json(&payload)
                .send()
                .await?
                .json::<Value>()
                .await?;
            let status = res["status"].as_str();
            if status.eq(&Some("DONE")) {
                return Ok(());
            };
            info!(
                "retrying wait for operation: {} current status: {:?}",
                operation_id, status
            );
            tokio::time::sleep(Duration::from_secs(15)).await;
            retries = retries - 1;
        }
    };
    Ok(())
}

pub async fn check_if_network_exists(
    network: &str,
    project_id: &str,
    auth_token: &str,
) -> anyhow::Result<bool> {
    let res = reqwest::Client::new()
        .get(format!(
            "{}/compute/v1/projects/{}/global/networks/{}",
            COMPUTE_ENDPOINT, &project_id, network
        ))
        .header(ACCEPT, "application/json")
        .bearer_auth(&auth_token)
        .send()
        .await?
        .json::<Value>()
        .await?;
    if !res["id"].is_null() {
        debug!("network already exists: {}", network);
        return Ok(true);
    }
    Ok(false)
}

pub async fn check_if_subnetwork_exists(
    subnetwork: &str,
    project_id: &str,
    region: &str,
    auth_token: &str,
) -> anyhow::Result<bool> {
    let res = reqwest::Client::new()
        .get(format!(
            "{}/compute/v1/projects/{}/regions/{}/subnetworks/{}",
            COMPUTE_ENDPOINT, &project_id, &region, subnetwork
        ))
        .header(ACCEPT, "application/json")
        .bearer_auth(&auth_token)
        .send()
        .await?
        .json::<Value>()
        .await?;
    if !res["id"].is_null() {
        debug!("subnetwork already exists: {}", subnetwork);
        return Ok(true);
    }
    Ok(false)
}

pub async fn check_if_firewall_exists(
    fw_rule: &str,
    project_id: &str,
    auth_token: &str,
) -> anyhow::Result<bool> {
    let res = reqwest::Client::new()
        .get(format!(
            "{}/compute/v1/projects/{}/global/firewalls/{}",
            COMPUTE_ENDPOINT, &project_id, fw_rule
        ))
        .header(ACCEPT, "application/json")
        .bearer_auth(&auth_token)
        .send()
        .await?
        .json::<Value>()
        .await?;
    if !res["id"].is_null() {
        debug!("firewall rule already exists: {}", fw_rule);
        return Ok(true);
    }
    Ok(false)
}

pub(crate) async fn check_if_node_pool_exists(
    node_pool_name: &str,
    cluster_id: &str,
    region: &str,
    project_id: &str,
    auth_token: &str,
) -> anyhow::Result<bool> {
    let res = reqwest::Client::new()
        .get(format!(
            "{}/v1/projects/{}/locations/{}/clusters/{}/nodePools/{}",
            CONTAINER_ENDPOINT, &project_id, region, cluster_id, node_pool_name
        ))
        .header(ACCEPT, "application/json")
        .bearer_auth(&auth_token)
        .send()
        .await?
        .json::<Value>()
        .await?;
    if res["status"].eq("RUNNING") {
        debug!("node pool already exists: {}", node_pool_name);
        return Ok(true);
    }
    Ok(false)
}

pub async fn list_objects(api: &Api<DynamicObject>) -> anyhow::Result<Vec<String>> {
    Ok(api
        .list(&Default::default())
        .await?
        .items
        .iter()
        .map(|v| &v.metadata)
        .filter_map(|v| v.name.to_owned())
        .collect::<Vec<String>>())
}

pub(crate) fn build_pod_env_vars(data: HashMap<&str, &str>) -> Vec<EnvVar> {
    let mut env_vars = vec![];
    data.into_iter().for_each(|(k, v)| {
        env_vars.push(EnvVar {
            name: k.to_string(),
            value: Some(v.to_string()),
            ..Default::default()
        });
    });
    env_vars
}

pub(crate) fn is_gpu_pod(resources: &ResourceRequirements) -> bool {
    resources
        .requests
        .iter()
        .map(|v| v.contains_key("nvidia.com/gpu"))
        .collect::<Vec<_>>()
        .iter()
        .any(|v| *v == true)
        || resources
            .limits
            .iter()
            .map(|v| v.contains_key("nvidia.com/gpu"))
            .collect::<Vec<_>>()
            .iter()
            .any(|v| *v == true)
}

pub(crate) fn get_machine_config_for_pod(pod: &Pod) -> anyhow::Result<MachineConfig> {
    let pod_ns = &pod.namespace().unwrap();
    let pod_name = &pod.name_any();

    match pod.labels().get("gpudirect") {
        Some(s) => {
            let gpu_direct_type: GpuDirectType = serde_json::from_value(json!(&s))?;
            Ok(MachineConfig::from(&gpu_direct_type))
        }
        None => {
            warn!(
                "gpudirect label is required for pod: {}/{}",
                pod_ns, pod_name
            );
            Err(anyhow!(
                "gpudirect label is required for pod: {}/{}",
                pod_ns,
                pod_name
            ))
        }
    }
}

pub(crate) fn build_net_interfaces_annotation_value(
    machine_config: &MachineConfig,
    pod_annotations: &BTreeMap<String, String>,
    gpu_direct_type: &GpuDirectType,
) -> anyhow::Result<Vec<serde_json::Value>> {
    let mut interfaces = vec![];
    let num_interfaces = MachineConfig::from(gpu_direct_type).num_net_interfaces;

    interfaces.push(json!({
        "interfaceName": "eth0",
        "network": "default"
    }));

    match pod_annotations.get("gpudirect-networks") {
        Some(v) => {
            let re = Regex::new(r"^(?P<prefix>.+)(\[(?P<start>\d+)-(?P<end>\d+)])$")?;
            let caps = re.captures(v);
            match caps {
                Some(caps) => {
                    let prefix = String::from(&caps["prefix"]);
                    let start = &caps["start"].parse::<i64>()?;
                    let end = &caps["end"].parse::<i64>()?;
                    let num_interfaces_configured = (end - start) + 1;

                    if num_interfaces_configured != num_interfaces {
                        return Err(anyhow!(
                            "gpudirect-networks requires {} networks.",
                            machine_config.num_net_interfaces
                        ));
                    };

                    for i in 1..=num_interfaces {
                        interfaces.push(json!({
                            "interfaceName": format!("eth{}", i),
                            "network": format!("{}{}", prefix, i)
                        }));
                    }
                }
                None => {
                    return Err(anyhow!(format!(
                        "gpudirect-networks should match pattern: {}",
                        r"^(?P<prefix>.+)(\[(?P<start>\d+)-(?P<end>\d+)\])$"
                    )));
                }
            }
        }
        None => {
            if !Args::parse().create_networks {
                return Err(anyhow!("gpudirect-networks annotation is required."));
            } else {
                for i in 1..=num_interfaces {
                    interfaces.push(json!({
                        "interfaceName": format!("eth{}", i),
                        "network": format!("vpc-{}", i)
                    }));
                }
            }
        }
    }
    Ok(interfaces)
}
