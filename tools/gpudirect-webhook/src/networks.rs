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

use crate::config::MachineConfig;
use crate::constants::COMPUTE_ENDPOINT;
use crate::{gcp_auth, utils};
use log::debug;
use reqwest::header::ACCEPT;
use serde_json::{Value, json};
use std::collections::HashMap;

pub async fn create(machine_config: &MachineConfig) -> anyhow::Result<()> {
    let prefix = "gpudirect";
    let num_networks = machine_config.num_net_interfaces;
    for index in 1..=num_networks {
        let project_id = gcp_auth::get_project_id().await?;
        let region = gcp_auth::get_region().await?;
        let auth_token = gcp_auth::get_access_token().await?;
        if !utils::check_if_network_exists(
            &format!("{}-{}", prefix, index),
            &project_id,
            &auth_token,
        )
        .await?
        {
            debug!("creating network: {}", format!("{}-{}", prefix, index));
            let net_res = reqwest::Client::new()
                .post(format!(
                    "{}/compute/v1/projects/{}/global/networks",
                    COMPUTE_ENDPOINT, &project_id
                ))
                .header(ACCEPT, "application/json")
                .bearer_auth(&auth_token)
                .json(&json!({
                  "name": format!("{}-{}", prefix, index),
                  "autoCreateSubnetworks": false,
                  "routingConfig": {
                    "routingMode": "GLOBAL"
                  }
                }))
                .send()
                .await?
                .json::<Value>()
                .await?;
            utils::wait_for_op(
                &project_id,
                &auth_token,
                None,
                &format!("{}/compute", COMPUTE_ENDPOINT),
                &net_res,
            )
            .await?;
        }
        let subnet_name = format!("{}-snet-{}", prefix, index);
        if !utils::check_if_subnetwork_exists(&subnet_name, &project_id, &region, &auth_token)
            .await?
        {
            debug!("creating subnetwork: {}", &subnet_name);
            let snet_res = reqwest::Client::new()
                .post(format!(
                    "{}/compute/v1/projects/{}/regions/{}/subnetworks",
                    COMPUTE_ENDPOINT, &project_id, &region
                ))
                .header(ACCEPT, "application/json")
                .bearer_auth(&auth_token)
                .json(&json!({
                    "name": format!("{}-snet-{}", prefix, index),
                    "network": format!("projects/{}/global/networks/{}-{}", &project_id, prefix, index),
                    "ipCidrRange": format!("10.48.{}.0/24", index),
                    "privateIpGoogleAccess": true,
                    "stackType": "IPV4_ONLY"
                }))
                .send()
                .await?
                .json::<Value>()
                .await?;
            utils::wait_for_op(
                &project_id,
                &auth_token,
                Some(&region),
                &format!("{}/compute", COMPUTE_ENDPOINT),
                &snet_res,
            )
            .await?;
        }

        let fw_rule_name = format!("fw-{}-{}", prefix, index);
        if !utils::check_if_firewall_exists(&fw_rule_name, &project_id, &auth_token).await? {
            debug!("creating firewall rule: {}", &fw_rule_name);
            let fw_res = reqwest::Client::new()
                .post(format!(
                    "{}/compute/v1/projects/{}/global/firewalls",
                    COMPUTE_ENDPOINT, &project_id
                ))
                .header(ACCEPT, "application/json")
                .bearer_auth(&auth_token)
                .json(&build_firewalls_payload(
                    fw_rule_name,
                    format!(
                        "projects/{}/global/networks/{}",
                        &project_id,
                        format!("{}-{}", prefix, index)
                    ),
                )?)
                .send()
                .await?
                .json::<Value>()
                .await?;
            utils::wait_for_op(
                &project_id,
                &auth_token,
                None,
                &format!("{}/compute", COMPUTE_ENDPOINT),
                &fw_res,
            )
            .await?;
        }
    }
    Ok(())
}

pub(crate) fn build_firewalls_payload(
    firewall_rule: String,
    network_self_link: String,
) -> anyhow::Result<Value> {
    let mut allowed = vec![];
    for protocol in vec!["TCP", "ICMP", "UDP"] {
        let mut data = HashMap::<String, Value>::new();
        data.insert(String::from("IPProtocol"), String::from(protocol).into());
        allowed.push(data);
    }
    let payload = json!({
        "name": firewall_rule,
        "direction": "INGRESS",
        "network": network_self_link,
        "sourceRanges": vec!["10.48.0.0/16"],
        "allowed": allowed
    });
    debug!(
        "firewall payload: {}",
        serde_json::to_string_pretty(&payload)?
    );
    Ok(payload)
}
