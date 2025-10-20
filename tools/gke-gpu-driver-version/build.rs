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

fn main() -> std::io::Result<()> {
    let protos = vec!["tools/src/pkg/gpuconfig/proto/gpu_driver_versions.proto"];

    tonic_prost_build::configure()
        .type_attribute(".", "#[derive(serde::Serialize, serde::Deserialize)]")
        .field_attribute("pb.GPUDevice.is_vgpu", "#[serde(default)]")
        .field_attribute(
            "pb.DriverVersion.supported_host_versions",
            "#[serde(default)]",
        )
        .field_attribute("pb.DriverVersion.label", "#[serde(default)]")
        .include_file("cos_tools.rs")
        .compile_protos(&protos, &["tools".into()])?;

    Ok(())
}
