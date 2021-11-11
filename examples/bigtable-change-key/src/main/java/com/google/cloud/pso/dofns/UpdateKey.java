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
import com.google.protobuf.ByteString;
import java.util.ArrayList;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.SerializableBiFunction;
import org.apache.beam.sdk.values.KV;

/**
 * This {@link DoFn} applies a function to a {@link Row} to change the key of that record. For that,
 * it applies a function, that needs to be specified by the user. That function uses the previous
 * key and any of the data included in the {@link Row} to produce a new key.
 *
 * <p>The result of applying this {@link DoFn} is a pair of key and value ({@link KV}), with the new
 * key and a {@link Iterable} of {@link Mutation}, to be applied with {@link
 * org.apache.beam.sdk.io.gcp.bigtable.BigtableIO.Write}.
 */
public class UpdateKey extends DoFn<Row, KV<ByteString, Iterable<Mutation>>> {

  private final SerializableBiFunction<String, Row, String> updateKeyFunc;

  /**
   * Create a @{link DoFn} to update the keys of a PCollection of a Bigtable {@link Row}.
   *
   * @param updateKeyFunc Function that accepts the previous key ({@link String}) and a {@link Row},
   *     and returns a {@link String} with the new key.
   */
  public UpdateKey(SerializableBiFunction<String, Row, String> updateKeyFunc) {
    this.updateKeyFunc = updateKeyFunc;
  }

  @ProcessElement
  public void processElement(ProcessContext c) {
    Row inputRow = c.element();
    String inputKey = inputRow.getKey().toStringUtf8();
    ByteString outputKey = ByteString.copyFromUtf8(updateKeyFunc.apply(inputKey, inputRow));

    // BigtableIO.write expects a list of mutations for each row
    ArrayList<Mutation> mutations = new ArrayList<>();
    for (Family cf : inputRow.getFamiliesList()) {
      for (Column col : cf.getColumnsList()) {
        for (Cell cell : col.getCellsList()) {
          Mutation m =
              Mutation.newBuilder()
                  .setSetCell(
                      Mutation.SetCell.newBuilder()
                          .setTimestampMicros(cell.getTimestampMicros())
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
}
