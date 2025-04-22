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

mod cluster;
mod config;
mod constants;
mod errors;
mod gcp_auth;
mod networks;
mod utils;
mod webhook;

use crate::config::MachineType;
use anyhow::Ok;
use axum::Router;
use axum::routing::post;
use axum_server::tls_rustls::RustlsConfig;
use clap::{ArgAction, Parser};
use config::MachineConfig;
use env_logger::Env;
use log::info;
use serde::Serialize;
use std::net::SocketAddr;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    env_logger::Builder::from_env(Env::default().default_filter_or("info"))
        .format_timestamp(None)
        .init();

    tokio_rustls::rustls::crypto::ring::default_provider()
        .install_default()
        .expect("rustls ring crypto provider installation failed.");

    let args = Args::parse();
    info!("args: {}", serde_json::to_string_pretty(&args)?);

    let node_pool_machine_config = MachineConfig::from(args.machine_type);
    if args.create_networks {
        networks::create(&node_pool_machine_config).await?;
        cluster::configure_networks(&node_pool_machine_config).await?;
    }
    if args.create_node_pool {
        cluster::create_node_pool(&node_pool_machine_config).await?;
    }

    cluster::wait_for_gpudirect_binary().await?;
    cluster::wait_for_device_injector().await?;

    let webhook = Router::new().route("/mutate", post(webhook::mutate));
    let certs_path = "/var/run/tls";
    let tls_config = RustlsConfig::from_pem_file(
        format!("{}/tls.crt", certs_path),
        format!("{}/tls.key", certs_path),
    )
    .await?;
    let addr = SocketAddr::from(([0, 0, 0, 0], 8443));
    info!("webhook listening on [::]:8443");
    axum_server::bind_rustls(addr, tls_config)
        .serve(webhook.into_make_service())
        .await?;

    Ok(())
}

#[derive(Parser, Debug, Serialize)]
#[clap(author, version, about, long_about = None)]
struct Args {
    #[arg(long, default_value = "")]
    #[serde(skip_serializing_if = "String::is_empty")]
    pub(crate) project_id: String,
    #[arg(long, value_enum, default_value_t)]
    pub(crate) machine_type: MachineType,
    #[arg(long, action=ArgAction::SetTrue)]
    pub(crate) create_networks: bool,
    #[arg(long, action=ArgAction::SetTrue)]
    pub(crate) create_node_pool: bool,
}
