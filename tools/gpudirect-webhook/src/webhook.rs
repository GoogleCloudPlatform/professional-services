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

use std::collections::HashMap;

use crate::config::{GpuDirectType, MachineConfig};
use crate::errors::WebhookError;
use crate::utils;
use anyhow::anyhow;
use axum::Json;
use axum::http::StatusCode;
use json_patch::Patch;
use k8s_openapi::api::core::v1::{
    Container, EmptyDirVolumeSource, EnvVar, HostPathVolumeSource, Pod, Volume, VolumeMount,
};
use kube::ResourceExt;
use kube::api::{DynamicObject, TypeMeta};
use kube::core::admission::{AdmissionResponse, AdmissionReview, META_API_VERSION_V1, META_KIND};
use log::{debug, info};
use serde_json::json;

pub(crate) async fn mutate(
    body: Json<AdmissionReview<DynamicObject>>,
) -> crate::errors::Result<(StatusCode, String)> {
    match &body.request {
        Some(req) => {
            let mut res = AdmissionResponse::from(req);
            let pod: Pod = req.object.to_owned().unwrap().try_parse()?;
            res.types = TypeMeta {
                kind: META_KIND.to_owned(),
                api_version: META_API_VERSION_V1.to_owned(),
            };
            let res = match build_patch(pod) {
                Ok(patch) => &res.with_patch(patch)?.into_review(),
                Err(e) => &res.deny(e.to_string()).into_review(),
            };
            Ok((StatusCode::OK, serde_json::to_string(res)?))
        }
        None => Err(WebhookError(anyhow!("error occurred!"))),
    }
}

fn build_patch(pod: Pod) -> anyhow::Result<Patch> {
    let machine_config = utils::get_machine_config_for_pod(&pod)?;
    let updated_pod: Pod = match machine_config.gpu_direct_type {
        GpuDirectType::TCPX => configure_tcpx_for_workload(pod.clone(), machine_config)?,
        GpuDirectType::TCPXO => configure_tcpxo_for_workload(pod.clone(), machine_config)?,
    };
    let original = serde_json::to_value(&pod)?;
    let updated = serde_json::to_value(&updated_pod)?;
    Ok(json_patch::diff(&original, &updated))
}

fn configure_tcpx_for_workload(mut pod: Pod, machine_config: MachineConfig) -> anyhow::Result<Pod> {
    let mut devices = vec![];

    for i in 0..8 {
        let mut data = HashMap::new();
        data.insert("path", format!("/dev/nvidia{}", i));
        devices.push(data);
    }

    let interfaces = utils::build_net_interfaces_annotation_value(
        &machine_config,
        pod.annotations(),
        &machine_config.gpu_direct_type,
    )?;

    let mut nvidia_ctl = HashMap::new();
    nvidia_ctl.insert("path", "/dev/nvidiactl".to_string());
    devices.push(nvidia_ctl);
    let mut nvidia_uvm = HashMap::new();
    nvidia_uvm.insert("path", "/dev/nvidia-uvm".to_string());
    devices.push(nvidia_uvm);

    let annotations = pod.annotations_mut();
    annotations.insert(
        "devices.gke.io/container.tcpx-daemon".to_string(),
        serde_yml::to_string(&devices)?,
    );
    annotations.insert(
        "networking.gke.io/default-interface".to_string(),
        "eth0".to_string(),
    );
    annotations.insert(
        "networking.gke.io/interfaces".to_string(),
        serde_json::to_string(&interfaces)?,
    );
    if let Some(spec) = pod.spec.as_mut() {
        if let Some(volumes) = spec.volumes.as_mut() {
            volumes.push(Volume {
                name: "libraries".to_string(),
                host_path: Some(HostPathVolumeSource {
                    path: "/home/kubernetes/bin/nvidia/lib64".to_string(),
                    ..Default::default()
                }),
                ..Default::default()
            });
            volumes.push(Volume {
                name: "sys".to_string(),
                host_path: Some(HostPathVolumeSource {
                    path: "/sys".to_string(),
                    ..Default::default()
                }),
                ..Default::default()
            });
            volumes.push(Volume {
                name: "proc-sys".to_string(),
                host_path: Some(HostPathVolumeSource {
                    path: "/proc/sys".to_string(),
                    ..Default::default()
                }),
                ..Default::default()
            });
            volumes.push(Volume {
                name: "tcpx-socket".to_string(),
                empty_dir: Some(EmptyDirVolumeSource {
                    ..Default::default()
                }),
                ..Default::default()
            });
        }
        let tcpx_daemon: Container = serde_json::from_value(json!({
          "name": "tcpx-daemon",
          "image": "us-docker.pkg.dev/gce-ai-infra/gpudirect-tcpx/tcpgpudmarxd-dev:v2.0.12",
          "imagePullPolicy": "Always",
          "command": [
            "/tcpgpudmarxd/build/app/tcpgpudmarxd",
            "--gpu_nic_preset",
            "a3vm",
            "--gpu_shmem_type",
            "fd",
            "--uds_path",
            "/run/tcpx",
            "--setup_param",
            "\\\"--verbose 128 2 0 \\\""
          ],
          "env": [
            {
              "name": "LD_LIBRARY_PATH",
              "value": "/usr/local/nvidia/lib64"
            }
          ],
          "securityContext": {
            "capabilities": {
              "add": [
                "NET_ADMIN"
              ]
            }
          },
          "volumeMounts": [
            {
              "mountPath": "/usr/local/nvidia/lib64",
              "name": "libraries"
            },
            {
              "mountPath": "/run/tcpx",
              "name": "tcpx-socket"
            },
            {
              "mountPath": "/hostsysfs",
              "name": "sys"
            },
            {
              "mountPath": "/hostprocsysfs",
              "name": "proc-sys"
            }
          ]
        }))?;
        spec.containers.push(tcpx_daemon);
        for container in spec.containers.iter_mut() {
            if let Some(resources) = &container.resources {
                if utils::is_gpu_pod(resources) {
                    let mut vms = vec![];
                    vms.push(VolumeMount {
                        name: "tcpx-socket".to_string(),
                        mount_path: "/tmp".to_string(),
                        ..Default::default()
                    });
                    vms.push(VolumeMount {
                        name: "libraries".to_string(),
                        mount_path: "/usr/local/nvidia/lib64".to_string(),
                        ..Default::default()
                    });
                    match container.volume_mounts.as_mut() {
                        Some(volume_mounts) => {
                            volume_mounts.extend_from_slice(&vms);
                        }
                        None => {
                            container.volume_mounts = Some(vms);
                        }
                    }
                    let ld_config = EnvVar {
                        name: "LD_LIBRARY_PATH".to_string(),
                        value: Some("/usr/local/nvidia/lib64:/usr/local/tcpx/lib64".to_string()),
                        ..Default::default()
                    };
                    let mut nccl_config = HashMap::new();
                    nccl_config.insert("NCCL_SOCKET_IFNAME", "eth0");
                    nccl_config.insert("NCCL_ALGO", "Ring");
                    nccl_config.insert("NCCL_PROTO", "Simple");
                    nccl_config.insert("NCCL_CROSS_NIC", "0");
                    nccl_config.insert("NCCL_NET_GDR_LEVEL", "PIX");
                    nccl_config.insert("NCCL_P2P_PXN_LEVEL", "0");
                    nccl_config.insert("NCCL_GPUDIRECTTCPX_SOCKET_IFNAME", "eth1,eth2,eth3,eth4");
                    nccl_config.insert("NCCL_GPUDIRECTTCPX_CTRL_DEV", "eth0");
                    nccl_config.insert("NCCL_DYNAMIC_CHUNK_SIZE", "524288");
                    nccl_config.insert("NCCL_P2P_NET_CHUNKSIZE", "524288");
                    nccl_config.insert("NCCL_P2P_PCI_CHUNKSIZE", "524288");
                    nccl_config.insert("NCCL_P2P_NVL_CHUNKSIZE", "1048576");
                    nccl_config.insert("NCCL_BUFFSIZE", "4194304");
                    nccl_config.insert("NCCL_NSOCKS_PERTHREAD", "4");
                    nccl_config.insert("NCCL_SOCKET_NTHREADS", "1");
                    nccl_config.insert("NCCL_GPUDIRECTTCPX_TX_BINDINGS", "\"eth1:8-21,112-125;eth2:8-21,112-125;eth3:60-73,164-177;eth4:60-73,164-177\"");
                    nccl_config.insert("NCCL_GPUDIRECTTCPX_RX_BINDINGS", "\"eth1:22-35,126-139;eth2:22-35,126-139;eth3:74-87,178-191;eth4:74-87,178-191\"");
                    nccl_config.insert(
                        "NCCL_GPUDIRECTTCPX_PROGRAM_FLOW_STEERING_WAIT_MICROS",
                        "500000",
                    );
                    let nccl_env_vars = utils::build_pod_env_vars(nccl_config);
                    match container.env.as_mut() {
                        Some(env_vars) => {
                            env_vars.push(ld_config);
                            env_vars.extend_from_slice(&nccl_env_vars);
                        }
                        None => {
                            let mut env_vars = vec![];
                            env_vars.push(ld_config);
                            env_vars.extend_from_slice(&nccl_env_vars);
                            container.env = Some(env_vars);
                        }
                    }
                }
            }
        }
    }
    debug!("{}", serde_json::to_string_pretty(&pod)?);
    info!(
        "configured {:?} for pod: {}/{}",
        machine_config.gpu_direct_type,
        pod.namespace().unwrap(),
        pod.name_any()
    );
    Ok(pod)
}

fn configure_tcpxo_for_workload(
    mut pod: Pod,
    machine_config: MachineConfig,
) -> anyhow::Result<Pod> {
    let mut devices = vec![];

    for i in 0..8 {
        let mut data = HashMap::new();
        data.insert("path", format!("/dev/nvidia{}", i));
        devices.push(data);
    }

    let interfaces = utils::build_net_interfaces_annotation_value(
        &machine_config,
        pod.annotations(),
        &machine_config.gpu_direct_type,
    )?;

    let mut nvidia_ctl = HashMap::new();
    nvidia_ctl.insert("path", "/dev/nvidiactl".to_string());
    devices.push(nvidia_ctl);
    let mut nvidia_uvm = HashMap::new();
    nvidia_uvm.insert("path", "/dev/nvidia-uvm".to_string());
    devices.push(nvidia_uvm);
    let mut dmabuf = HashMap::new();
    dmabuf.insert("path", "/dev/dmabuf_import_helper".to_string());
    devices.push(dmabuf);

    let annotations = pod.annotations_mut();
    annotations.insert(
        "devices.gke.io/container.tcpx-daemon".to_string(),
        serde_yml::to_string(&devices)?,
    );
    annotations.insert(
        "networking.gke.io/default-interface".to_string(),
        "eth0".to_string(),
    );
    annotations.insert(
        "networking.gke.io/interfaces".to_string(),
        serde_json::to_string(&interfaces)?,
    );
    if let Some(spec) = pod.spec.as_mut() {
        if let Some(volumes) = spec.volumes.as_mut() {
            volumes.push(Volume {
                name: "libraries".to_string(),
                host_path: Some(HostPathVolumeSource {
                    path: "/home/kubernetes/bin/nvidia/lib64".to_string(),
                    ..Default::default()
                }),
                ..Default::default()
            });
            volumes.push(Volume {
                name: "sys".to_string(),
                host_path: Some(HostPathVolumeSource {
                    path: "/sys".to_string(),
                    ..Default::default()
                }),
                ..Default::default()
            });
            volumes.push(Volume {
                name: "proc-sys".to_string(),
                host_path: Some(HostPathVolumeSource {
                    path: "/proc/sys".to_string(),
                    ..Default::default()
                }),
                ..Default::default()
            });
            volumes.push(Volume {
                name: "aperture-devices".to_string(),
                host_path: Some(HostPathVolumeSource {
                    path: "/dev/aperture_devices".to_string(),
                    ..Default::default()
                }),
                ..Default::default()
            });
        }
        let tcpx_daemon: Container = serde_json::from_value(json!({
            "args": [
                "set -ex\nchmod 755 /fts/entrypoint_rxdm_container.sh\n/fts/entrypoint_rxdm_container.sh --num_hops=2 --num_nics=8 --uid= --alsologtostderr\n"
            ],
            "command": [
                "/bin/sh",
                "-c"
            ],
            "env": [
                {
                    "name": "LD_LIBRARY_PATH",
                    "value": "/usr/local/nvidia/lib64"
                }
            ],
            "image": "us-docker.pkg.dev/gce-ai-infra/gpudirect-tcpxo/tcpgpudmarxd-dev:v1.0.14",
            "imagePullPolicy": "Always",
            "name": "tcpxo-daemon",
            "resources": {},
            "securityContext": {
                "capabilities": {
                    "add": [
                        "NET_ADMIN",
                        "NET_BIND_SERVICE"
                    ]
                }
            },
            "terminationMessagePath": "/dev/termination-log",
            "terminationMessagePolicy": "File",
            "volumeMounts": [
                {
                    "mountPath": "/usr/local/nvidia",
                    "name": "libraries"
                },
                {
                    "mountPath": "/hostsysfs",
                    "name": "sys"
                },
                {
                    "mountPath": "/hostprocsysfs",
                    "name": "proc-sys"
                }
            ]
        }))?;
        spec.containers.push(tcpx_daemon);
        for container in spec.containers.iter_mut() {
            if let Some(resources) = &container.resources {
                if utils::is_gpu_pod(resources) {
                    let mut vms = vec![];
                    vms.push(VolumeMount {
                        name: "aperture-devices".to_string(),
                        mount_path: "/dev/aperture_devices".to_string(),
                        ..Default::default()
                    });
                    match container.volume_mounts.as_mut() {
                        Some(volume_mounts) => {
                            volume_mounts.extend_from_slice(&vms);
                        }
                        None => {
                            container.volume_mounts = Some(vms);
                        }
                    }
                    let ld_config = EnvVar {
                        name: "LD_LIBRARY_PATH".to_string(),
                        value: Some("/usr/local/nvidia/lib64".to_string()),
                        ..Default::default()
                    };
                    let fastrak_llcm = EnvVar {
                        name: "NCCL_FASTRAK_LLCM_DEVICE_DIRECTORY".to_string(),
                        value: Some("/dev/aperture_devices".to_string()),
                        ..Default::default()
                    };
                    let mut nccl_config = HashMap::new();
                    nccl_config.insert("NCCL_FASTRAK_CTRL_DEV", "eth0");
                    nccl_config.insert(
                        "NCCL_FASTRAK_IFNAME",
                        "eth1,eth2,eth3,eth4,eth5,eth6,eth7,eth8",
                    );
                    nccl_config.insert("NCCL_SOCKET_IFNAME", "eth0");
                    nccl_config.insert("NCCL_CROSS_NIC", "0");
                    nccl_config.insert("NCCL_ALGO", "Ring,Tree");
                    nccl_config.insert("NCCL_PROTO", "Simple");
                    nccl_config.insert("NCCL_MIN_NCHANNELS", "4");
                    nccl_config.insert("NCCL_TUNER_PLUGIN", "libnccl-tuner.so");
                    nccl_config.insert(
                        "NCCL_TUNER_CONFIG_PATH",
                        "/usr/local/nvidia/lib64/a3plus_tuner_config.textproto",
                    );
                    nccl_config.insert(
                        "NCCL_SHIMNET_GUEST_CONFIG_CHECKER_CONFIG_FILE",
                        "/usr/local/nvidia/lib64/a3plus_guest_config.textproto",
                    );
                    nccl_config.insert("NCCL_DYNAMIC_CHUNK_SIZE", "524288");
                    nccl_config.insert("NCCL_P2P_NET_CHUNKSIZE", "524288");
                    nccl_config.insert("NCCL_P2P_PCI_CHUNKSIZE", "524288");
                    nccl_config.insert("NCCL_P2P_NVL_CHUNKSIZE", "1048576");
                    nccl_config.insert("NCCL_FASTRAK_NUM_FLOWS", "2");
                    nccl_config.insert("NCCL_FASTRAK_USE_SNAP", "1");
                    nccl_config.insert("NCCL_FASTRAK_PLUGIN_ACCEPT_TIMEOUT_MS", "600000");
                    nccl_config.insert("NCCL_FASTRAK_ENABLE_CONTROL_CHANNEL", "0");
                    nccl_config.insert("NCCL_BUFFSIZE", "8388608");
                    nccl_config.insert("CUDA_VISIBLE_DEVICES", "0,1,2,3,4,5,6,7");
                    nccl_config.insert("NCCL_NET_GDR_LEVEL", "PIX");
                    nccl_config.insert("NCCL_FASTRAK_ENABLE_HOTPATH_LOGGING", "0");
                    nccl_config.insert("NCCL_FASTRAK_USE_LLCM", "1");
                    nccl_config.insert("NCCL_NVLS_ENABLE", "0");
                    // recommended, to log NCCL errors
                    nccl_config.insert("NCCL_DEBUG", "WARN");
                    nccl_config.insert("NCCL_DEBUG_SUBSYS", "INIT,NET,ENV,COLL,GRAPH");
                    let nccl_env_vars = utils::build_pod_env_vars(nccl_config);
                    match container.env.as_mut() {
                        Some(env_vars) => {
                            env_vars.push(ld_config);
                            env_vars.push(fastrak_llcm);
                            env_vars.extend_from_slice(&nccl_env_vars);
                        }
                        None => {
                            let mut env_vars = vec![];
                            env_vars.push(ld_config);
                            env_vars.push(fastrak_llcm);
                            env_vars.extend_from_slice(&nccl_env_vars);
                            container.env = Some(env_vars);
                        }
                    }
                }
            }
        }
    }
    debug!("{}", serde_json::to_string_pretty(&pod)?);
    info!(
        "configured {:?} for pod: {}/{}",
        machine_config.gpu_direct_type,
        pod.namespace().unwrap(),
        pod.name_any()
    );
    Ok(pod)
}
