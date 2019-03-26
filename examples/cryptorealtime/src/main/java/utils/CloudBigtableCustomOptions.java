// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


package utils;

import org.apache.beam.runners.dataflow.options.DataflowPipelineOptions;
import org.apache.beam.sdk.options.Description;

/**
 * Used for custom validation messages
 */
public interface CloudBigtableCustomOptions extends DataflowPipelineOptions {

    @Description("The Google Cloud project ID for the Cloud Bigtable cluster.")
    String getBigtableProjectId();

    void setBigtableProjectId(String bigtableProjectId);

    @Description("The Google Cloud Bigtable instance ID .")
    String getBigtableInstanceId();

    void setBigtableInstanceId(String bigtableInstanceId);

    @Description("The Cloud Bigtable cluster ID.")
    String getBigtableClusterId();

    void setBigtableClusterId(String bigtableClusterId);

    @Description("The Google Cloud zone ID in which the cluster resides.")
    String getBigtableZoneId();


    void setBigtableZoneId(String bigtableZoneId);

    @Description("The Cloud Bigtable table ID in the cluster." )
    String getBigtableTableId();

    void setBigtableTableId(String bigtableTableId);

    @Description("The Google Cloud family for your table")
    String getBigtableFamily();

    void setBigtableFamily(String bigtableFamily);

}
