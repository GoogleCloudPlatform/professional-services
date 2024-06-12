/*
 *
 *  Copyright (c) 2024  Google LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may not
 *  use this file except in compliance with the License. You may obtain a copy of
 *  the License at  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *  License for the specific language governing permissions and limitations under
 *  the License.
 */

package com.google.dataflow.feature;

import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.StringUtf8Coder;
import org.apache.beam.sdk.state.StateSpec;
import org.apache.beam.sdk.state.StateSpecs;
import org.apache.beam.sdk.state.TimeDomain;
import org.apache.beam.sdk.state.Timer;
import org.apache.beam.sdk.state.TimerSpec;
import org.apache.beam.sdk.state.TimerSpecs;
import org.apache.beam.sdk.state.ValueState;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;
import org.joda.time.Duration;
import org.joda.time.Instant;

public class ExpireValue<String, Y> extends DoFn<KV<String, Y>, KV<String, Y>> {

    private final Y defaultValue;

    @TimerId("reset")
    private final TimerSpec timer = TimerSpecs.timer(TimeDomain.EVENT_TIME);

    @StateId("state")
    private final StateSpec<ValueState<String>> state =
            StateSpecs.value((Coder<String>) StringUtf8Coder.of());

    public ExpireValue(Y defaultValue) {
        this.defaultValue = defaultValue;
    }

    @ProcessElement
    public void processElement(
            ProcessContext pc,
            @Timestamp Instant ts,
            @Element KV<String, Y> elem,
            @StateId("state") ValueState<String> state,
            @TimerId("reset") Timer timer,
            OutputReceiver<KV<String, Y>> or) {
        timer.withOutputTimestamp(ts.plus(Duration.standardSeconds(30)))
                .set(ts.plus(Duration.standardSeconds(30)));
        state.write(elem.getKey());
        or.output(elem);
    }

    @OnTimer("reset")
    public void expire(
            OutputReceiver<KV<String, Y>> output, @StateId("state") ValueState<String> state) {
        final String read = state.read();
        state.clear();
        output.output(KV.of(read, defaultValue));
    }
}
