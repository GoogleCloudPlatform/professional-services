package com.google.cloud.pso.transforms;

import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
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
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnit;
import org.mockito.junit.MockitoRule;

public class JsonSchemaExistTest {
  @Rule public final MockitoRule mockito = MockitoJUnit.rule();
  @Rule public final transient TestPipeline pipeline = TestPipeline.create();

  @Mock private static BQDatasetSchemas mockBQDatasetSchema = BQDatasetSchemas.getInstance();

  final KV<String, String> MOCK_INPUT =
      KV.of(
          "dlog_test",
          "{\"match\":{\"match_id\":17347515257000858472,\"tournament_id\":\"1.0,123,45679,78911,0\",\"server_id\":0},\"esports\":{\"esports_event_count\":1268,\"tournament_id\":\"1.0,123,45679,78911,0\"},\"total_solokills\":2,\"array_check\":[0,1,2],\"sneak_defuses\":0}");

  KV<String, String> TESTME =
      KV.of(
          "ihaffa",
          "{\"ihaffa\":{\"match_id\":17347515257000858472,\"tournament_id\":\"1.0,123,45679,78911,0\",\"server_id\":0},\"esports\":{\"esports_event_count\":1268,\"tournament_id\":\"1.0,123,45679,78911,0\"},\"total_solokills\":2,\"array_check\":[0,1,2],\"sneak_defuses\":0}");

  @Before
  public final void setup() throws Exception {}

  @Test
  public void buildMatchedJsonNodeFromTableSchema_returnJsonNodeMatchesSchema()
      throws JsonMappingException, JsonProcessingException {
    // Arrange
    PCollection<KV<String, String>> testPColl = pipeline.apply(Create.of(MOCK_INPUT));
    PCollectionTuple testPCollTuple =
        testPColl.apply(
            ParDo.of(new JsonSchemaExist("test_dataset").withTestServices(mockBQDatasetSchema))
                .withOutputTags(Constants.MAIN_TAG, TupleTagList.of(Constants.UNKNOWN_SCHEMA_TAG)));

    // Act
    when(mockBQDatasetSchema.isTableSchemaExist("dlog_test")).thenReturn(true);
    PCollection<KV<String, String>> pCollResMain = testPCollTuple.get(Constants.MAIN_TAG);
    PCollection<KV<String, String>> pCollResUnknown =
        testPCollTuple.get(Constants.UNKNOWN_SCHEMA_TAG);

    // Assert
    PAssert.thatSingleton(pCollResMain).isEqualTo(MOCK_INPUT);
    PAssert.that(pCollResUnknown).empty();
    pipeline.run();
  }

  @Test
  public void buildMatchedJsonNodeFromTableSchema_returnJsonNodeUnknownSchema()
      throws JsonMappingException, JsonProcessingException {
    // Arrange
    PCollection<KV<String, String>> testPColl = pipeline.apply(Create.of(MOCK_INPUT));
    when(mockBQDatasetSchema.isTableSchemaExist("dlog_test")).thenReturn(false);

    // Act
    PCollectionTuple testPCollTuple =
        testPColl.apply(
            ParDo.of(new JsonSchemaExist("test_dataset").withTestServices(mockBQDatasetSchema))
                .withOutputTags(Constants.MAIN_TAG, TupleTagList.of(Constants.UNKNOWN_SCHEMA_TAG)));

    PCollection<KV<String, String>> pCollResMain = testPCollTuple.get(Constants.MAIN_TAG);
    PCollection<KV<String, String>> pCollResUnknown =
        testPCollTuple.get(Constants.UNKNOWN_SCHEMA_TAG);

    // Assert
    PAssert.thatSingleton(pCollResUnknown).isEqualTo(MOCK_INPUT);
    PAssert.that(pCollResMain).empty();
    pipeline.run();
  }
}
