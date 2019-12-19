/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.demo.dataflow;

import org.apache.beam.runners.dataflow.options.DataflowPipelineOptions;
import org.apache.beam.sdk.options.*;

    public interface DFPipelineOptions extends DataflowPipelineOptions {

        @Description("GCS location of PDC file")
        ValueProvider<String> getInputFilePattern();
        void setInputFilePattern(ValueProvider<String> value);

        @Description("Expected dataset name")
        ValueProvider<String> getDataset();
        void setDataset(ValueProvider<String> value);

        @Description("Expect table name")
        ValueProvider<String> getTableName();
        void setTableName(ValueProvider<String> value);

    }