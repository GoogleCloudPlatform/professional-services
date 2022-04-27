/**
 * Copyright 2020 Google LLC
 *
 * <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 *
 * <p>http://www.apache.org/licenses/LICENSE-2.0
 *
 * <p>Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.cloud.pso.dofns;

import com.google.bigtable.v2.*;
import com.google.cloud.Tuple;
import com.google.protobuf.ByteString;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.apache.beam.sdk.testing.PAssert;
import org.apache.beam.sdk.testing.TestPipeline;
import org.apache.beam.sdk.transforms.Create;
import org.apache.beam.sdk.transforms.FlatMapElements;
import org.apache.beam.sdk.transforms.MapElements;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.TypeDescriptor;
import org.apache.beam.sdk.values.TypeDescriptors;
import org.apache.commons.lang3.StringUtils;
import org.junit.Rule;
import org.junit.Test;

/** Test the {@link UpdateKey} DoFn ({@link org.apache.beam.sdk.transforms.DoFn}). */
public class UpdateKeyTest {
  // TestPipelines used in the unit tests
  @Rule public final transient TestPipeline testPipelineCount = TestPipeline.create();
  @Rule public final transient TestPipeline testPipelineSchema = TestPipeline.create();
  @Rule public final transient TestPipeline testPipelineTransform = TestPipeline.create();

  // Some elements with dummy data for the tests
  private final Tuple<String, List<String>> t1 =
      Tuple.of("key132#a", Arrays.asList("cf1:c1:132", "cf1:c2:a", "cf2:c1:car"));
  private final Tuple<String, List<String>> t2 =
      Tuple.of("key276#b", Arrays.asList("cf1:c1:276", "cf1:c2:b", "cf2:c1:boat"));
  private final Tuple<String, List<String>> t3 =
      Tuple.of(
          "key112#x", Arrays.asList("cf1:c1:112", "cf1:c2:x", "cf2:c1:balloon", "cf2:c2:extra"));
  // Some collections to be used for tests with PAssert
  private final Iterable<Row> elements =
      Stream.of(t1, t2, t3).map(this::tuple2Row).collect(Collectors.toList());
  private final Iterable<ByteString> keys =
      Stream.of(t1, t2, t3)
          .map(this::tuple2Row)
          .map(elem -> elem.getKey())
          .collect(Collectors.toList());
  private final Iterable<String> familyNames =
      Stream.of(t1, t2, t3)
          .map(this::tuple2Row)
          .flatMap(elem -> elem.getFamiliesList().stream().map(x -> x.getName()))
          .collect(Collectors.toList());
  private final Iterable<String> transformedKeys =
      Stream.of(t1, t2, t3)
          .map(this::tuple2Row)
          .map(elem -> anotherTransformKey(elem.getKey().toStringUtf8(), elem))
          .collect(Collectors.toList());

  /** Identity function for the key used as utility during tests. */
  private static String identityTransformKey(String key, Row record) {
    return key;
  }

  /** Just another function to test if the key transform is properly applied */
  private static String anotherTransformKey(String key, Row record) {
    return "reversed#" + StringUtils.reverse(key);
  }

  /**
   * Just a convenience method to transform values into {@link Row}, so we can use them with the
   * pipeline
   *
   * @param t A {@link Tuple} with the key and values to include in the {@link Row}.
   * @return A {@link Row} with the same values as with the Tuple, and some schema
   */
  private Row tuple2Row(Tuple<String, List<String>> t) {
    ByteString key = ByteString.copyFromUtf8(t.x());
    Row.Builder rowBuilder = Row.newBuilder().setKey(key);

    for (String value : t.y()) {
      String[] splits = value.split(":");
      String cfName = splits[0];
      ByteString colName = ByteString.copyFromUtf8(splits[1]);
      ByteString cellValue = ByteString.copyFromUtf8(splits[2]);

      Cell c = Cell.newBuilder().setValue(cellValue).build();
      Column col = Column.newBuilder().setQualifier(colName).addCells(c).build();
      Family family = Family.newBuilder().setName(cfName).addColumns(col).build();
      Row tempRow = Row.newBuilder().addFamilies(family).build();

      rowBuilder.mergeFrom(tempRow);
    }

    return rowBuilder.build();
  }

  /**
   * Test that the number of elements is the same before and after applying the {@link UpdateKey}
   * transform.
   */
  @Test
  public void testCountElements() {

    // Create pipeline with elements
    UpdateKey updateKeyDoFn = new UpdateKey(UpdateKeyTest::identityTransformKey);

    PCollection<Row> input =
        testPipelineCount.apply("Elements for count test", Create.of(elements));
    // Apply transform
    PCollection<KV<ByteString, Iterable<Mutation>>> transformed =
        input.apply("Transform for count test", ParDo.of(updateKeyDoFn));

    // Check that the keys have not changed
    PCollection<ByteString> transformedKeys =
        transformed.apply(
            "Extract keys for count test",
            MapElements.into(TypeDescriptor.of(ByteString.class)).via(e -> e.getKey()));

    // The keys should be the same
    PAssert.that(transformedKeys).containsInAnyOrder(keys);

    testPipelineCount.run();
  }

  /**
   * Test that the schema of the input and output records is the same for all records. Because
   * different records may have different columns, we will test that we always see the same column
   * families.
   */
  @Test
  public void testSameSchema() {
    PCollection<Row> input =
        testPipelineSchema.apply("Elements for schema test", Create.of(elements));
    // Apply transform
    PCollection<KV<ByteString, Iterable<Mutation>>> transformed =
        input.apply(
            "Transform for schema test",
            ParDo.of(new UpdateKey(UpdateKeyTest::identityTransformKey)));

    // Extract column families from Mutations
    PCollection<String> familiesPCol =
        transformed.apply(
            "Extract families names for schema test",
            FlatMapElements.into(TypeDescriptors.strings())
                .via(
                    e -> {
                      Iterable<Mutation> mutations = e.getValue();
                      ArrayList<String> families = new ArrayList<>();
                      for (Mutation m : mutations) {
                        String family = m.getSetCell().getFamilyName();
                        families.add(family);
                      }

                      return families;
                    }));

    PAssert.that(familiesPCol).containsInAnyOrder(familyNames);

    testPipelineSchema.run();
  }

  /**
   * Test that the transform key function is correctly applied to all the elements in the {@link
   * PCollection}.
   */
  @Test
  public void testTransformApplied() {
    PCollection<Row> input =
        testPipelineTransform.apply("Elements for Transform test", Create.of(elements));

    PCollection<KV<ByteString, Iterable<Mutation>>> transformed =
        input.apply(
            "Transform step in test", ParDo.of(new UpdateKey(UpdateKeyTest::anotherTransformKey)));

    PCollection<String> collKeys =
        transformed.apply(
            "Extract transformed keys",
            MapElements.into(TypeDescriptors.strings()).via(e -> e.getKey().toStringUtf8()));

    PAssert.that(collKeys).containsInAnyOrder(transformedKeys);

    testPipelineTransform.run();
  }
}
