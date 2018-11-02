/*
 * Copyright (C) 2018 Google Inc.
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

package com.google.cloud.pso.pubsub;

import com.google.cloud.pso.Employee;
import com.google.cloud.pso.pubsub.common.ObjectPublisher;
import com.google.cloud.pso.pubsub.common.ObjectReader;
import com.google.protobuf.ByteString;
import org.apache.beam.sdk.coders.AvroCoder;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

/**
 * An implementation of the {@link ObjectPublisher} to publish test {@link Employee} objects to
 * Pub/Sub
 */
public class EmployeePublisher extends ObjectPublisher<Employee> {

    /**
     * Since the primary consumer of these records would be a Dataflow pipeline that will
     * use the AvroCoder to decode the message, it is easier to use the same to encode the
     * messages on the publishing side.
     */
    private static final AvroCoder<Employee> CODER = AvroCoder.of(Employee.class);

    @Override
    public ByteString serialize(Employee employee) throws IOException {
        ByteString byteString;
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            CODER.encode(employee, bos);
            byteString = ByteString.copyFrom(bos.toByteArray());
        }
        return byteString;
    }

    /**
     * Initializes a reader for publishing {@link Employee} records and executes
     * the parent class's {@link ObjectPublisher#run(Args, ObjectReader)} method
     * to publish the records to Pub/Sub
     * @param args Arguments used by {@link ObjectPublisher} to configure the
     *             {@link com.google.api.gax.batching.BatchingSettings}
     * @throws IOException
     */
    public void publish(Args args) throws IOException {
        /**
         * For demonstration purposes we will use an implementation of ObjectReader
         * to generate random Employee objects to be published.
         */
        ObjectReader<Employee> employeeReader =
                new GenerateRandomEmployeeReader(args.getNumOfMessages());

        this.run(args, employeeReader);
    }
}
