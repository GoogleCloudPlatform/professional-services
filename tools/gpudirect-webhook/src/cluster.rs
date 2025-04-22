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

use std::time::Duration;

use crate::config::MachineConfig;
use crate::constants::CONTAINER_ENDPOINT;
use crate::{gcp_auth, utils};
use anyhow::anyhow;
use axum::http::header::ACCEPT;
use k8s_openapi::api::apps::v1::DaemonSet;
use kube::Api;
use kube::api::{GroupVersionKind, PostParams};
use kube::core::DynamicObject;
use log::{debug, info, warn};
use serde_json::{Value, json};

pub async fn configure_networks(machine_config: &MachineConfig) -> anyhow::Result<()> {
    let k8s_client = kube::Client::try_default().await?;
    let net_gvk = GroupVersionKind::gvk("networking.gke.io", "v1", "Network");
    let net_param_set_gvk = GroupVersionKind::gvk("networking.gke.io", "v1", "GKENetworkParamSet");
    let (net_ar, _) = kube::discovery::pinned_kind(&k8s_client, &net_gvk).await?;
    let (net_param_set_ar, _) =
        kube::discovery::pinned_kind(&k8s_client, &net_param_set_gvk).await?;
    let net_api = Api::<DynamicObject>::all_with(k8s_client.clone(), &net_ar);
    let net_param_set_api = Api::<DynamicObject>::all_with(k8s_client.clone(), &net_param_set_ar);

    let networks = utils::list_objects(&net_api).await?;
    debug!("networks: {:?}", &networks);
    let network_param_sets = utils::list_objects(&net_param_set_api).await?;
    debug!("network param sets: {:?}", &network_param_sets);
    for i in 1..=machine_config.num_net_interfaces {
        if !networks.contains(&format!("vpc-{}", i)) {
            net_api
                .create(
                    &PostParams::default(),
                    &serde_json::from_value(json!({
                    "apiVersion": "networking.gke.io/v1",
                    "kind": "Network",
                    "metadata": {
                        "name": format!("vpc-{}", i),
                        "namespace": "default",
                        "annotations": {
                            "managed-by": "gpudirect-webhook",
                        },
                    },
                    "spec": {
                        "type": "Device",
                        "parametersRef": {
                            "group": "networking.gke.io",
                            "kind": "GKENetworkParamSet",
                            "name": format!("vpc-{}", i)
                        }
                    }}))?,
                )
                .await?;
        }
        if !network_param_sets.contains(&format!("vpc-{}", i)) {
            net_param_set_api
                .create(
                    &PostParams::default(),
                    &serde_json::from_value(json!({
                    "apiVersion": "networking.gke.io/v1",
                    "kind": "GKENetworkParamSet",
                    "metadata": {
                        "name": format!("vpc-{}", i),
                        "namespace": "default",
                        "annotations": {
                            "managed-by": "gpudirect-webhook",
                        }
                    },
                    "spec": {
                        "vpc": format!("gpudirect-{}", i),
                        "vpcSubnet": format!("gpudirect-snet-{}", i),
                        "deviceMode": "NetDevice"
                    }}))?,
                )
                .await?;
        }
    }
    info!("completed configuring networks");
    Ok(())
}

pub async fn create_node_pool(machine_config: &MachineConfig) -> anyhow::Result<()> {
    let project_id = gcp_auth::get_project_id().await?;
    let region = gcp_auth::get_region().await?;
    let auth_token = gcp_auth::get_access_token().await?;
    let cluster_id = gcp_auth::get_cluster_id().await?;
    let node_pool_name = format!("gpudirect-tcpx-{}", machine_config.machine_type);

    if utils::check_if_node_pool_exists(
        &node_pool_name,
        &cluster_id,
        &region,
        &project_id,
        &auth_token,
    )
    .await?
    {
        debug!("node pool {} already exists.", node_pool_name);
        return Ok(());
    }

    let mut networks = vec![];
    for i in 1..=machine_config.num_net_interfaces {
        networks.push(json!({
          "network": format!("gpudirect-{}", i),
          "subnetwork": format!("gpudirect-snet-{}", i)
        }));
    }
    let payload = json!({
      "nodePool": {
        "initialNodeCount": 1,
        "autoscaling": {
          "enabled": true,
          "totalMinNodeCount": 1,
          "totalMaxNodeCount": 4
        },
        "name": node_pool_name,
        "networkConfig": {
            "additionalNodeNetworkConfigs": networks,
            "enablePrivateNodes": true
        },
        "config": {
          "machineType": machine_config.machine_type,
          "accelerators": [
            {
              "acceleratorType": machine_config.accelerator,
              "acceleratorCount": machine_config.accelerator_count
            }
          ],
          "spot": true,
          "gvnic": {
            "enabled": true,
          },
          "fastSocket": {
            "enabled": true
          }
        }
      },
      "parent": format!("projects/{}/locations/{}/clusters/{}", project_id, region, cluster_id)
    });
    match reqwest::Client::new()
        .post(format!(
            "{}/v1/projects/{}/locations/{}/clusters/{}/nodePools",
            CONTAINER_ENDPOINT, &project_id, region, cluster_id
        ))
        .header(ACCEPT, "application/json")
        .bearer_auth(&auth_token)
        .json(&payload)
        .send()
        .await?
        .json::<Value>()
        .await
    {
        Ok(res) => {
            info!("node pool create response: {:?}", &res);
            utils::wait_for_op(
                &project_id,
                &auth_token,
                Some(&region.to_string()),
                CONTAINER_ENDPOINT,
                &res,
            )
            .await?;
            Ok(())
        }
        Err(_) => Err(anyhow!("error occurred creating node pool")),
    }
}

pub(crate) async fn wait_for_gpudirect_binary() -> anyhow::Result<()> {
    let k8s_client = kube::Client::try_default().await?;
    let mut retries = 4;
    while retries != 0 {
        match Api::<DaemonSet>::namespaced(k8s_client.clone(), "kube-system")
            .get_opt("nccl-tcpx-installer")
            .await?
        {
            Some(_) => {
                return Ok(());
            }
            None => {
                tokio::time::sleep(Duration::from_secs(30)).await;
                retries = retries - 1;
            }
        }
    }
    warn!("install nccl-tcpx-installer");
    Ok(())
}

pub(crate) async fn wait_for_device_injector() -> anyhow::Result<()> {
    let k8s_client = kube::Client::try_default().await?;
    let mut retries = 4;
    while retries != 0 {
        match Api::<DaemonSet>::namespaced(k8s_client.clone(), "kube-system")
            .get_opt("device-injector")
            .await?
        {
            Some(_) => {
                return Ok(());
            }
            None => {
                tokio::time::sleep(Duration::from_secs(30)).await;
                retries = retries - 1;
            }
        }
    }
    warn!("install device-injector");
    Ok(())
}
