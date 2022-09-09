/*
 * Copyright (C) 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
package com.google.cloud.pso.transforms;

import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.cloud.bigquery.Field;
import com.google.cloud.bigquery.Field.Mode;
import com.google.cloud.bigquery.FieldList;
import com.google.cloud.bigquery.StandardSQLTypeName;
import com.google.cloud.pso.util.BQDatasetSchemas;
import com.google.cloud.pso.util.Constants;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.TupleTagList;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnit;
import org.mockito.junit.MockitoRule;

@RunWith(JUnit4.class)
public class JsonEventMatcherTest {
  @Rule public final MockitoRule mockito = MockitoJUnit.rule();
  @Rule public final transient TestPipeline pipeline = TestPipeline.create();

  @Mock private static BQDatasetSchemas mockBQDatasetSchema;

  JsonFactory factory = new JsonFactory();
  ObjectMapper mapper = new ObjectMapper(factory);
  private FieldList esportsMatchStartFields;

  @Before
  public final void setup() throws Exception {
    esportsMatchStartFields =
        FieldList.of(
            Field.newBuilder(
                    "match",
                    StandardSQLTypeName.STRUCT,
                    Field.of("match_id", StandardSQLTypeName.INT64),
                    Field.of("tournament_id", StandardSQLTypeName.STRING),
                    Field.of("server_id", StandardSQLTypeName.INT64))
                .build(),
            Field.newBuilder(
                    "esports",
                    StandardSQLTypeName.STRUCT,
                    Field.of("esports_event_count", StandardSQLTypeName.INT64),
                    Field.of("tournament_id", StandardSQLTypeName.STRING))
                .build(),
            Field.of("total_solokills", StandardSQLTypeName.INT64),
            Field.newBuilder("array_check", StandardSQLTypeName.INT64)
                .setMode(Mode.REPEATED)
                .build(),
            Field.of("sneak_defuses", StandardSQLTypeName.INT64));
  }

  @Test
  @SuppressWarnings("unchecked")
  public void buildMatchedJsonNodeFromTableSchema_returnJsonNodeMatchesSchema()
      throws JsonMappingException, JsonProcessingException {
    // Arrange
    PCollection<KV<String, String>> testPColl =
        pipeline.apply(
            Create.of(KV.of("dlog_test", buildCorrectCDLVanguardJsonSample().toString())));
    PCollectionTuple testPCollTuple =
        testPColl.apply(
            ParDo.of(new JsonEventMatcher("mockdataset").withTestServices(mockBQDatasetSchema))
                .withOutputTags(Constants.MAIN_TAG, TupleTagList.of(Constants.UNMATCH_SCHEMA_TAG)));

    // Act
    when(mockBQDatasetSchema.getFieldList("dlog_test")).thenReturn(esportsMatchStartFields);
    PCollection<KV<String, String>> pCollResMain = testPCollTuple.get(Constants.MAIN_TAG);
    PCollection<KV<String, String>> pCollResUnmatch =
        testPCollTuple.get(Constants.UNMATCH_SCHEMA_TAG);

    // Assert
    PAssert.that(pCollResMain)
        .containsInAnyOrder(KV.of("dlog_test", buildCorrectCDLVanguardJsonSample().toString()));
    PAssert.that(pCollResUnmatch).empty();
    pipeline.run();
  }

  @Test
  @SuppressWarnings("unchecked")
  public void buildMatchedJsonNodeFromTableSchema_returnNullOnMissingField()
      throws JsonMappingException, JsonProcessingException {
    // Arrange
    PCollection<KV<String, String>> testPColl =
        pipeline.apply(
            Create.of(KV.of("dlog_test", buildMissingFieldCDLVanguardJsonSample().toString())));
    PCollectionTuple testPCollTuple =
        testPColl.apply(
            ParDo.of(new JsonEventMatcher("mockdataset").withTestServices(mockBQDatasetSchema))
                .withOutputTags(Constants.MAIN_TAG, TupleTagList.of(Constants.UNMATCH_SCHEMA_TAG)));
    ObjectNode expected = (ObjectNode) buildMissingFieldCDLVanguardJsonSample();
    expected.set("sneak_defuses", NullNode.getInstance());

    // Act
    when(mockBQDatasetSchema.getFieldList("dlog_test")).thenReturn(esportsMatchStartFields);
    PCollection<KV<String, String>> pCollResMain = testPCollTuple.get(Constants.MAIN_TAG);
    PCollection<KV<String, String>> pCollResUnmatch =
        testPCollTuple.get(Constants.UNMATCH_SCHEMA_TAG);

    // Assert
    PAssert.that(pCollResMain).containsInAnyOrder(KV.of("dlog_test", expected.toString()));
    PAssert.that(pCollResUnmatch)
        .containsInAnyOrder(
            KV.of("dlog_test", buildMissingFieldCDLVanguardJsonSample().toString()));
    pipeline.run();
  }

  private JsonNode buildCorrectCDLVanguardJsonSample()
      throws JsonMappingException, JsonProcessingException {
    String result =
        "{\"match\":{\"match_id\":17347515257000858472,\"tournament_id\":\"1.0,123,45679,78911,0\",\"server_id\":0},\"esports\":{\"esports_event_count\":1268,\"tournament_id\":\"1.0,123,45679,78911,0\"},\"total_solokills\":2,\"array_check\":[0,1,2],\"sneak_defuses\":0}";
    JsonNode jsonNode = mapper.readTree(result);

    return jsonNode;
  }

  private JsonNode buildMissingFieldCDLVanguardJsonSample()
      throws JsonMappingException, JsonProcessingException {
    String result =
        "{\"match\":{\"match_id\":17347515257000858472,\"tournament_id\":\"1.0,123,45679,78911,0\",\"server_id\":0},\"esports\":{\"esports_event_count\":1268,\"tournament_id\":\"1.0,123,45679,78911,0\"},\"total_solokills\":2,\"array_check\":[0,1,2]}";
    JsonNode jsonNode = mapper.readTree(result);

    return jsonNode;
  }
}
