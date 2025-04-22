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

use serde::{Deserialize, Serialize};

#[derive(Debug, Default, Clone, Serialize, clap::ValueEnum)]
#[serde(rename_all = "kebab-case")]
pub enum MachineType {
    #[default]
    A3Mega,
    A3High,
}

#[derive(Debug, Clone)]
pub struct MachineConfig {
    pub(crate) machine_type: String,
    pub(crate) accelerator: String,
    pub(crate) accelerator_count: i64,
    pub(crate) num_net_interfaces: i64,
    pub(crate) gpu_direct_type: GpuDirectType,
}

impl From<MachineType> for MachineConfig {
    fn from(machine_type: MachineType) -> Self {
        match machine_type {
            MachineType::A3High => MachineConfig {
                machine_type: "a3-highgpu-8g".to_string(),
                accelerator: "nvidia-h100-80gb".to_string(),
                accelerator_count: 8,
                num_net_interfaces: 4,
                gpu_direct_type: GpuDirectType::TCPX,
            },
            MachineType::A3Mega => MachineConfig {
                machine_type: "a3-megagpu-8g".to_string(),
                accelerator: "nvidia-h100-mega-80gb".to_string(),
                accelerator_count: 8,
                num_net_interfaces: 8,
                gpu_direct_type: GpuDirectType::TCPXO,
            },
        }
    }
}

impl From<&GpuDirectType> for MachineConfig {
    fn from(gpu_direct_type: &GpuDirectType) -> Self {
        match gpu_direct_type {
            GpuDirectType::TCPX => MachineConfig {
                machine_type: "a3-highgpu-8g".to_string(),
                accelerator: "nvidia-h100-80gb".to_string(),
                accelerator_count: 8,
                num_net_interfaces: 4,
                gpu_direct_type: GpuDirectType::TCPX,
            },
            GpuDirectType::TCPXO => MachineConfig {
                machine_type: "a3-highgpu-8g".to_string(),
                accelerator: "nvidia-h100-80gb".to_string(),
                accelerator_count: 8,
                num_net_interfaces: 8,
                gpu_direct_type: GpuDirectType::TCPXO,
            },
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, clap::ValueEnum, Eq, PartialEq)]
#[serde(rename_all = "lowercase")]
pub(crate) enum GpuDirectType {
    TCPX,
    TCPXO,
}
