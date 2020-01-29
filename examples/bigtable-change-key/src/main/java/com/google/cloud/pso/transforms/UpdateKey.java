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
package com.google.cloud.pso.transforms;

import com.google.bigtable.v2.*;
import com.google.protobuf.ByteString;
import java.util.ArrayList;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.transforms.SerializableBiFunction;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;

public class UpdateKey
    extends PTransform<PCollection<Row>, PCollection<KV<ByteString, Iterable<Mutation>>>> {

  private SerializableBiFunction<String, Row, String> updateKeyFunc;

  /**
   * Create a PTransform to update the keys of a PCollection of a Bigtable {@link Row}.
   *
   * @param updateKeyFunc Function that accepts the previous key (String) and a {@link Row}, and
   *     returns a String with the new key.
   */
  public UpdateKey(SerializableBiFunction<String, Row, String> updateKeyFunc) {
    this.updateKeyFunc = updateKeyFunc;
  }

  /**
   * Apply the transform key function to every element in the collection, and return a collection of
   * {@link Mutation} to be applied by {@link org.apache.beam.sdk.io.gcp.bigtable.BigtableIO::write}
   *
   * @param input The {@link PCollection} of {@link Row}.
   * @return The collection of mutations with the new key, to be written to Bigtable.
   */
  @Override
  public PCollection<KV<ByteString, Iterable<Mutation>>> expand(PCollection<Row> input) {
    PCollection<KV<ByteString, Iterable<Mutation>>> output =
        input.apply(
            ParDo.of(
                new DoFn<Row, KV<ByteString, Iterable<Mutation>>>() {
                  @ProcessElement
                  public void processElement(ProcessContext c) {
                    Row inputRow = c.element();
                    String inputKey = inputRow.getKey().toStringUtf8();
                    ByteString outputKey =
                        ByteString.copyFromUtf8(updateKeyFunc.apply(inputKey, inputRow));

                    // BigtableIO.write expects a list of mutations for each row
                    ArrayList<Mutation> mutations = new ArrayList<>();
                    for (Family cf : inputRow.getFamiliesList()) {
                      for (Column col : cf.getColumnsList()) {
                        for (Cell cell : col.getCellsList()) {
                          Mutation m =
                              Mutation.newBuilder()
                                  .setSetCell(
                                      Mutation.SetCell.newBuilder()
                                          .setValue(cell.getValue())
                                          .setColumnQualifier(col.getQualifier())
                                          .setFamilyName(cf.getName()))
                                  .build();
                          mutations.add(m);
                        }
                      }
                    }

                    c.output(KV.of(outputKey, mutations));
                  }
                }));

    return output;
  }
}
