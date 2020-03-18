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

package com.google.cloud.pso.dataflowthrottling;

import static com.google.common.base.MoreObjects.firstNonNull;
import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

import com.google.common.collect.Iterables;
import java.io.Serializable;
import java.util.concurrent.ThreadLocalRandom;
import org.apache.beam.sdk.coders.Coder;
import org.apache.beam.sdk.coders.VarIntCoder;
import org.apache.beam.sdk.state.BagState;
import org.apache.beam.sdk.state.StateSpec;
import org.apache.beam.sdk.state.StateSpecs;
import org.apache.beam.sdk.state.TimeDomain;
import org.apache.beam.sdk.state.Timer;
import org.apache.beam.sdk.state.TimerSpec;
import org.apache.beam.sdk.state.TimerSpecs;
import org.apache.beam.sdk.state.ValueState;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.PTransform;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.KV;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.TupleTag;
import org.apache.beam.sdk.values.TupleTagList;
import org.joda.time.Duration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Transform steps:
 * 1. DynamicThrottlingTransform Divides the PCollection into a number of groups specified in Builder class & then starts processing each group.
 * 2. A follow up transform invokes the timer to process the payload queued in BagState.
 * 3. Each event is sent to the clientCall in accordance to the client request rejection logic.
 * 4. Based on the response of the clientCall appropriate counters will get incremented. Counters are zeroed each time resetCounterTimer gets invoked.
 *
 * @param <InputT>  Type of the event from the source.
 * @param <OutputT> Type of the output from the external service.
 */
public class DynamicThrottlingTransform<InputT, OutputT> extends PTransform<PCollection<InputT>, PCollectionTuple> {

    private static final Logger LOG = LoggerFactory.getLogger(ThrottlingOrchestration.class);

    /**
     * Define tuple tags to process corresponding payload response.
     */
    private final TupleTag<OutputT> successTag = new TupleTag<OutputT>() {
    };
    private final TupleTag<Result<InputT>> errorTag = new TupleTag<Result<InputT>>() {
    };
    private final TupleTag<Result<InputT>> throttlingTag = new TupleTag<Result<InputT>>() {
    };

    private final int numberOfGroups;
    private final java.time.Duration batchInterval;
    private final java.time.Duration resetCounterInterval;
    private final int numOfEventsToBeProcessedForBatch;
    private final int kInRejectionProbability;
    private final Coder<InputT> inputElementCoder;
    private final ClientCall<InputT, OutputT> clientCall;
    private ThrottlingStrategy throttlingStrategy;

    /**
     * Builder class to set client-side throttling parameter.
     *
     * @param <BuilderInputT> Type of the event from the source.
     * @param <BuilderOutpuT> Type of the output from the external service.
     */
    public static class Builder<BuilderInputT, BuilderOutpuT> {
        private int kInRejectionProbability = 1;
        private java.time.Duration resetCounterInterval = java.time.Duration.ofMinutes(1);
        private java.time.Duration batchInterval = java.time.Duration.ofSeconds(1);
        private int numberOfGroups = 1;
        private int numOfEventsToBeProcessedForBatch;
        private Coder<BuilderInputT> inputElementCoder;
        private ClientCall<BuilderInputT, BuilderOutpuT> clientCall;
        private ThrottlingStrategy throttlingStrategy;

        /**
         * The constructor for DynamicThrottlingTransform.Builder.
         *
         * @param clientCall                       Processes requests to the external service.
         * @param inputElementCoder                Coder for incoming events.
         * @param numOfEventsToBeProcessedForBatch Limits the number of events for each batch.
         */
        public Builder(ClientCall<BuilderInputT, BuilderOutpuT> clientCall, Coder<BuilderInputT> inputElementCoder, int numOfEventsToBeProcessedForBatch) {
            this.clientCall = clientCall;
            this.inputElementCoder = inputElementCoder;
            this.numOfEventsToBeProcessedForBatch = numOfEventsToBeProcessedForBatch;
        }

        /**
         * When the rejection probability is high but the external service starts accepting requests, client-side
         * throttling can take long time to recover. To prevent this reset all the counters to
         * zero out the rejection probability.
         * optional: defaults to 1 minute.
         *
         * @param resetCounterInterval Time interval for resetting the counter.
         * @return
         */
        public Builder<BuilderInputT, BuilderOutpuT> withResetCounterInterval(java.time.Duration resetCounterInterval) {
            this.resetCounterInterval = resetCounterInterval;
            return this;
        }

        /**
         * Dataflow throttling processes the events in batch. This parameter defines how often batches are sent to
         * the external service.
         * optional: Defaults to 1 second.
         *
         * @param batchInterval Time interval to process each batches.
         * @return
         */
        public Builder<BuilderInputT, BuilderOutpuT> withBatchInterval(java.time.Duration batchInterval) {
            this.batchInterval = batchInterval;
            return this;
        }

        /**
         * Use this parameter to parallelise processing of events in multiple dataflow groups.
         * optional: Defaults to 1 group.
         *
         * @param numberOfGroups
         * @return
         */
        public Builder<BuilderInputT, BuilderOutpuT> withNumberOfGroups(int numberOfGroups) {
            this.numberOfGroups = numberOfGroups;
            return this;
        }

        /**
         * This is K in rejection probability. It is directly proportional to the number of
         * requests sent to the backend. See Adaptive throttling section in README file.
         * optional: Defaults to 1.
         *
         * @param kInRejectionProbability K in rejection probability.
         * @return
         */
        public Builder<BuilderInputT, BuilderOutpuT> withKInRejectionProbability(int kInRejectionProbability) {
            this.kInRejectionProbability = kInRejectionProbability;
            return this;
        }

        /**
         * This defines a strategy that is applied when a request is throttled by an external service or by a DataflowThrottlingTransform itself.
         *
         * @param throttlingStrategy
         * @return
         */
        public Builder<BuilderInputT, BuilderOutpuT> withThrottlingStrategy(ThrottlingStrategy throttlingStrategy) {
            this.throttlingStrategy = throttlingStrategy;
            return this;
        }

        /**
         * Builds the DynamicThrottlingTransform object.
         *
         * @return
         */
        public DynamicThrottlingTransform<BuilderInputT, BuilderOutpuT> build() {
            return new DynamicThrottlingTransform<BuilderInputT, BuilderOutpuT>(this);
        }
    }

    /**
     * Result object that will be passed to the throttling and error output pcollection.
     *
     * @param <InputT> Type of the event from the source.
     */
    public static class Result<InputT> implements Serializable {
        private InputT input;
        private String error;

        public Result(InputT input, String error) {
            this.input = input;
            this.error = error;
        }
    }

    /**
     * This functionalInterface is used to pass the paylod to clientcall.
     *
     * @param <InputT> Type of the event from the source.
     * @param <OutpuT> Type of the enriched event.
     */
    @FunctionalInterface
    public interface ClientCall<InputT, OutpuT> extends Serializable {
        OutpuT call(InputT n) throws Exception;
    }

    /**
     * The {com.google.cloud.pso.dataflowthrottling.DynamicThrottlingTransform} constructor provides the custom execution options passed by the client.
     *
     * @param builder object which holds the user defined params.
     */
    private DynamicThrottlingTransform(Builder<InputT, OutputT> builder) {
        this.numberOfGroups = builder.numberOfGroups;
        this.batchInterval = builder.batchInterval;
        this.resetCounterInterval = builder.resetCounterInterval;
        this.numOfEventsToBeProcessedForBatch = builder.numOfEventsToBeProcessedForBatch;
        this.kInRejectionProbability = builder.kInRejectionProbability;
        this.inputElementCoder = builder.inputElementCoder;
        this.clientCall = builder.clientCall;
        this.throttlingStrategy = builder.throttlingStrategy;
    }

    /**
     * Collection of responses for accepted requests.
     *
     * @return PCollection<ClientCallResponses>
     */
    public TupleTag<OutputT> getSuccessTag() {
        return successTag;
    }

    /**
     * Collection of request responses of all error codes except 200,429.
     *
     * @return Collection of clientCall responses except 200 and 429>
     */
    public TupleTag<Result<InputT>> getErrorTag() {
        return errorTag;
    }

    /**
     * Collection of rejected requests and throttled requests.
     *
     * @return Collection of throttledRequests with error code.
     */
    public TupleTag<Result<InputT>> getThrottlingTag() {
        return throttlingTag;
    }

    /**
     * @param input payload from the source.
     * @return PCollectionTuple of tuple tags.
     */
    @Override
    public PCollectionTuple expand(PCollection<InputT> input) {
        /**
         * {Grouping} Segregates incoming events into a single or multiple groups.
         */
        PCollection<KV<Integer, InputT>> groups = input.apply("Grouping", ParDo.of(new DoFn<InputT, KV<Integer, InputT>>() {
            @DoFn.ProcessElement
            public void processElement(ProcessContext context) {
                context.output(KV.of(ThreadLocalRandom.current().nextInt(1, numberOfGroups + 1), context.element()));
            }
        }));

        TimeDomain timerDomain;
        if (input.isBounded().equals(PCollection.IsBounded.UNBOUNDED)) {
            timerDomain = TimeDomain.PROCESSING_TIME;
        } else {
            timerDomain = TimeDomain.EVENT_TIME;
        }

        /**
         * {Throttling}: Payload is either sent to the external service or rejected based on the rejection probability.
         * Process element will add the payload to the {incomingReqBagState}.
         */
        PCollectionTuple enriched = groups.apply("Throttling", ParDo.of(new DoFn<KV<Integer, InputT>, OutputT>() {
            @StateId("acceptedRequests")
            private final StateSpec<ValueState<Integer>> acceptedRequestsStateSpec =
                    StateSpecs.value(VarIntCoder.of());

            @StateId("incomingReqBagState")
            private final StateSpec<BagState<InputT>> incomingReqBagStateSpec =
                    StateSpecs.bag(inputElementCoder);

            @StateId("totalProcessedRequests")
            private final StateSpec<ValueState<Integer>> totalProcessedRequestsStateSpec =
                    StateSpecs.value(VarIntCoder.of());

            @TimerId("resetCountsTimer")
            private final TimerSpec resetCountsTimerSpec = TimerSpecs.timer(timerDomain);

            @TimerId("incomingReqBagTimer")
            private final TimerSpec incomingReqBagTimerSpec = TimerSpecs.timer(timerDomain);

            /**
             * @param context Payload that should be sent by the client.
             * @param totalProcessedRequests Counts the total number of requests processed by client.
             * @param incomingReqBagState BagState, which holds the requests to process in batch.
             * @param resetCountsTimer Timer that resets the counter for every n minutes.
             * @param incomingReqBagTimer Timer that is invoked for every N minutes irrespective of the bag size.
             */
            @ProcessElement
            public void processElement(ProcessContext context,
                                       @StateId("acceptedRequests") ValueState<Integer> acceptedRequests,
                                       @StateId("totalProcessedRequests") ValueState<Integer> totalProcessedRequests,
                                       @StateId("incomingReqBagState") BagState<InputT> incomingReqBagState,
                                       @TimerId("resetCountsTimer") Timer resetCountsTimer,
                                       @TimerId("incomingReqBagTimer") Timer incomingReqBagTimer) {

                if (incomingReqBagState.isEmpty().read()) {
                    incomingReqBagTimer.offset(Duration.millis(batchInterval.toMillis())).setRelative();
                }
                if (firstNonNull(totalProcessedRequests.read(), 0) == 0) {
                    resetCountsTimer.offset(Duration.millis(resetCounterInterval.toMillis())).setRelative();
                }
                incomingReqBagState.add(context.element().getValue());
            }

            /**
             * Timer that processes n requests each time it gets invoked.
             * @param context Payload that should be sent by the client.
             * @param acceptedRequests Counts the total number of requests processed by client and got accepted by the backend.
             */
            @OnTimer("incomingReqBagTimer")
            public void incomingReqBagTimer(
                    OnTimerContext context,
                    @StateId("acceptedRequests") ValueState<Integer> acceptedRequests,
                    @StateId("incomingReqBagState") BagState<InputT> incomingReqBagState,
                    @StateId("totalProcessedRequests") ValueState<Integer> totalProcessedRequests,
                    @TimerId("incomingReqBagTimer") Timer incomingReqBagTimer) {
                Iterable<InputT> bag = incomingReqBagState.read();

                int acceptedReqCount = firstNonNull(acceptedRequests.read(), 0);
                int totalReqCount = firstNonNull(totalProcessedRequests.read(), 0);
                List<InputT> retryRequests = new ArrayList<InputT>();

                for (InputT value : Iterables.limit(bag, numOfEventsToBeProcessedForBatch)) {
                    //Calculates requests rejection probability
                    double reqRejectionProbability = (totalReqCount - (kInRejectionProbability * acceptedReqCount)) / (totalReqCount + 1);
                    double randomValue = Math.random();
                    OutputT successTagValue;
                    boolean accepted = TRUE;
                    Result<InputT> result;
                    if ((reqRejectionProbability) <= randomValue) {
                        totalReqCount = totalReqCount + 1;
                        totalProcessedRequests.write((int) totalReqCount);
                        try {
                            successTagValue = clientCall.call(value);
                            acceptedReqCount = acceptedReqCount + 1;
                            acceptedRequests.write(acceptedReqCount);
                            context.output(successTag, successTagValue);
                        } catch (ThrottlingException e) {
                            switch (throttlingStrategy) {
                                case DLQ:
                                    context.output(throttlingTag, result = new Result<>(value, e.getMessage()));
                                    break;
                                case DROP:
                                    break;
                                case RETRY:
                                    retryRequests.add(value);
                                    break;
                            }
                            accepted = FALSE;
                        } catch (Exception e) {
                            accepted = FALSE;
                            context.output(errorTag, result = new Result<>(value, e.getMessage()));
                        }
                    } else {
                        switch (throttlingStrategy){
                            case DLQ:
                                context.output(throttlingTag, result = new Result<>(value, "Throttled by Client. Request rejection probability: " + reqRejectionProbability));
                                break;
                            case DROP:
                                break;
                            case RETRY:
                                retryRequests.add(value);
                                break;
                        }
                        accepted = FALSE;
                    }
                    LOG.debug("  totalCount-" + totalReqCount + ",  reqRejecProb-" + reqRejectionProbability + ",  Random-" + randomValue + ", " + accepted + ",  acceptCount-" + acceptedReqCount);
                }

                List<InputT> latestElements = new ArrayList<InputT>();
                Iterables.addAll(latestElements, Iterables.skip(bag, numOfEventsToBeProcessedForBatch));
                incomingReqBagState.clear();
                for (InputT b : latestElements) {
                    incomingReqBagState.add(b);
                }
                for (InputT b : retryRequests){
                    incomingReqBagState.add(b);
                }
                incomingReqBagTimer.offset(Duration.millis(batchInterval.toMillis())).setRelative();
            }

            /**
             * Timer that resets counters when ever it's get invoked.
             */
            @OnTimer("resetCountsTimer")
            public void resetCountsTimer(
                    OnTimerContext c,
                    @StateId("totalProcessedRequests") ValueState<Integer> totalProcessedRequests,
                    @StateId("acceptedRequests") ValueState<Integer> acceptedRequests,
                    @TimerId("resetCountsTimer") Timer resetCountsTimer) {
                totalProcessedRequests.clear();
                acceptedRequests.clear();
                resetCountsTimer.offset(Duration.millis(resetCounterInterval.toMillis())).setRelative();
            }
        }).withOutputTags(successTag, TupleTagList.of(errorTag).and(throttlingTag)));
        return enriched;
    }
}
