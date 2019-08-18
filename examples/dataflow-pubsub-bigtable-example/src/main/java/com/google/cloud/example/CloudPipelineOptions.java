/*
 * Copyright 2019 Google LLC All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.example;

import org.apache.beam.sdk.extensions.gcp.options.CloudResourceManagerOptions;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.Validation;

public interface CloudPipelineOptions extends EnterprisePipelineOptions, CloudResourceManagerOptions {
    @Description("Subscription name")
    @Validation.Required
    String getSubscription();
    void setSubscription(String subscription);

    @Description("BigTable Instance ID")
    @Validation.Required
    String getInstanceId();
    void setInstanceId(String instanceId);

    @Description("BigTable Table Id")
    @Validation.Required
    String getTableId();
    void setTableId(String tableId);

    @Description("BigTable Column Family")
    @Validation.Required
    String getColumnFamily();
    void setColumnFamily(String columnFamily);

    @Description("BigTable Column Qualifier")
    @Validation.Required
    String getColumn();
    void setColumn(String column);
}