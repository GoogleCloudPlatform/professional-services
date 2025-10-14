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

use anyhow::Ok;
use chrono::Utc;
use clap::Parser;
use env_logger::Env;
use log::error;

use crate::pb::GpuDriverVersionInfoList;

tonic::include_proto!("cos_tools");

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    env_logger::Builder::from_env(Env::default().default_filter_or("info"))
        .format_timestamp(None)
        .init();

    let gke_to_cos_versions =
        reqwest::get("https://www.gstatic.com/gke-image-maps/gke-to-cos.json")
            .await?
            .json::<GkeToCos>()
            .await?;

    let args = Args::parse();

    let cos_version = gke_to_cos_versions
        .entries
        .into_iter()
        .find(|v| args.cluster_version.eq(&v.gke_version))
        .map(|v| v.image);

    match cos_version {
        Some(v) => {
            let mut data = v.rsplit("-").into_iter().take(3).collect::<Vec<_>>();

            data.reverse();

            let version = data.join(".");
            let proto = reqwest::get(format!(
                "https://storage.googleapis.com/cos-tools/{}/lakitu/gpu_driver_versions.textproto",
                version
            ))
            .await?
            .text()
            .await?;

            let list: GpuDriverVersionInfoList = serde_yml::from_str(&proto)?;
            let mut result = GpuVersionData::default();
            result.creation_time = gke_to_cos_versions.creation_time;
            result.cos_version = v;
            list.gpu_driver_version_info
                .into_iter()
                .filter(|v| match &v.gpu_device {
                    Some(device) => device.gpu_type == args.gpu_type,
                    None => false,
                })
                .flat_map(|v| v.supported_driver_versions)
                .for_each(|v| {
                    if v.label == "DEFAULT" {
                        result.default_driver_version = v.version.clone();
                    }
                    if v.label == "LATEST" {
                        result.latest_driver_version = v.version.clone();
                    }
                });
            println!("{}", serde_json::to_string_pretty(&result)?);
        }
        None => error!("cos version not found for cluster version"),
    }

    Ok(())
}

#[derive(Parser, Debug)]
#[clap(author, version, about, long_about = None)]
struct Args {
    #[arg(long, default_value = "")]
    cluster_version: String,
    #[arg(long, default_value = "")]
    gpu_type: String,
}

#[derive(serde::Deserialize, Debug)]
struct GkeToCos {
    entries: Vec<GkeVersionToCosImage>,
    creation_time: chrono::DateTime<Utc>,
}

#[derive(serde::Deserialize, Debug)]
struct GkeVersionToCosImage {
    gke_version: String,
    image: String,
}

#[derive(serde::Serialize, Default)]
struct GpuVersionData {
    cos_version: String,
    latest_driver_version: String,
    default_driver_version: String,
    creation_time: chrono::DateTime<Utc>,
}
