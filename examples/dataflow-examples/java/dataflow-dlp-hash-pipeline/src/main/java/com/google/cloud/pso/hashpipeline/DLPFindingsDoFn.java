/*
 * Copyright (C) 2020 Google Inc.
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

package com.google.cloud.pso.hashpipeline;

import com.google.cloud.dlp.v2.DlpServiceClient;
import com.google.privacy.dlp.v2.ByteContentItem;
import com.google.privacy.dlp.v2.ContentItem;
import com.google.privacy.dlp.v2.Finding;
import com.google.privacy.dlp.v2.InfoType;
import com.google.privacy.dlp.v2.InspectConfig;
import com.google.privacy.dlp.v2.InspectContentRequest;
import com.google.privacy.dlp.v2.InspectContentResponse;
import com.google.privacy.dlp.v2.InspectResult;
import com.google.privacy.dlp.v2.Likelihood;
import com.google.privacy.dlp.v2.LocationName;
import com.google.protobuf.ByteString;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.DoFn.ProcessContext;
import org.apache.beam.sdk.transforms.DoFn.ProcessElement;
import org.apache.beam.sdk.transforms.DoFn.Setup;
import org.apache.beam.sdk.transforms.DoFn.Teardown;
import org.apache.beam.sdk.values.KV;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The {@link DLPTokenizationDoFn} class executes tokenization request by calling DLP api. It uses
 * DLP table as a content item as CSV file contains fully structured data. DLP templates (e.g.
 * de-identify, inspect) need to exist before this pipeline runs. As response from the API is
 * received, this DoFn outputs KV of new table with table id as key.
 */
public class DLPFindingsDoFn extends DoFn<KV<String, String>, KV<String, String>> {
  private static final Logger log = LoggerFactory.getLogger(DLPFindingsDoFn.class);

  private String dlpProjectId;
  private DlpServiceClient dlpServiceClient;
  private InspectConfig inspectConfig;

  public DLPFindingsDoFn(String dlpProjectId) {
    this.dlpProjectId = dlpProjectId;
    this.dlpServiceClient = null;
    List<InfoType> infoTypes =
        Stream.of("US_SOCIAL_SECURITY_NUMBER")
            .map(it -> InfoType.newBuilder().setName(it).build())
            .collect(Collectors.toList());
    this.inspectConfig =
        InspectConfig.newBuilder()
            .addAllInfoTypes(infoTypes)
            .setMinLikelihood(Likelihood.VERY_UNLIKELY)
            .setIncludeQuote(true)
            .build();
  }

  @Setup
  public void setup() throws RuntimeException {
    try {
      this.dlpServiceClient = DlpServiceClient.create();

    } catch (IOException e) {
      log.error("Failed to create DLP Service Client", e.getMessage());
      throw new RuntimeException(e);
    }
  }

  @Teardown
  public void teardown() throws Exception {
    if (this.dlpServiceClient != null) {
      this.dlpServiceClient.close();
    }
  }

  @ProcessElement
  public void processElement(ProcessContext c) throws IOException {
    KV<String, String> entry = c.element();
    ByteContentItem byteContentItem =
        ByteContentItem.newBuilder()
            .setType(ByteContentItem.BytesType.TEXT_UTF8)
            .setData(ByteString.copyFromUtf8(entry.getValue()))
            .build();

    ContentItem contentItem = ContentItem.newBuilder().setByteItem(byteContentItem).build();
    InspectContentRequest request =
        InspectContentRequest.newBuilder()
            .setParent(LocationName.of(this.dlpProjectId, "global").toString())
            .setInspectConfig(this.inspectConfig)
            .setItem(contentItem)
            .build();

    InspectContentResponse response = dlpServiceClient.inspectContent(request);
    InspectResult result = response.getResult();
    if (result.getFindingsCount() > 0) {
      for (Finding finding : result.getFindingsList()) {
        String quote = finding.getQuote();
        // log.info("QUOTE: " + quote);
        c.output(KV.of(entry.getKey(), quote));
      }
    }
  }
}
