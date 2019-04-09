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

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;

import com.google.common.collect.Iterables;
import java.io.IOException;
import java.io.Serializable;
import java.util.concurrent.ThreadLocalRandom;
import org.apache.beam.repackaged.beam_sdks_java_core.org.apache.commons.lang3.ObjectUtils;
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
 * What does com.google.cloud.pso.dataflowthrottling.DynamicThrottlingTransform?
 * Firstly, divides the PCollection into n number of groups specified in Builder class & then starts processing each group.
 * Follow up transform will invoke the timer to process the payload queued in BagState.
 * How does it process each event?
 * Each event will send to the clientCall to process it if the rejection probability is lesser.
 * Based on the response of the clientCall appropriate counters will get incremented.
 * Counters will be zeroed each time resetCounterTimer gets invoked.
 * @param <InputT> Type of the event from the source.
 * @param <OutputT> Type of the enriched event.
 */
public class DynamicThrottlingTransform<InputT, OutputT> extends PTransform<PCollection<InputT>, PCollectionTuple> {

    private static final Logger LOG = LoggerFactory.getLogger(ThrottlingOrchestration.class);

    /**
     * Define tuple tags to process corresponding payload response.
     */
    private final TupleTag<OutputT>  successTag = new TupleTag<OutputT>() {};
    private final TupleTag<Result<InputT>> errorTag = new TupleTag<Result<InputT>>() {};
    private final TupleTag<Result<InputT>> throttlingTag = new TupleTag<Result<InputT>>() {};

    private final int numberOfGroups;
    private final java.time.Duration batchInterval;
    private final java.time.Duration resetCounterInterval;
    private final int numOfEventsToBeProcessedForBatch;
    private final int kInRejectionProbability;
    private final Coder<InputT> elemCoder;
    private final ClientCall<InputT, OutputT> clientCall;

    /**
     * Builder class to set either properties defined by client or to default.
     * @param <BuilderInputT> Type of the event from the source.
     * @param <BuilderOutpuT> Type of the enriched event.
     */
    public static class Builder<BuilderInputT, BuilderOutpuT>{
        private int kInRejectionProbability=1;
        private java.time.Duration resetCounterInterval= java.time.Duration.ofMinutes(1);
        private java.time.Duration batchInterval= java.time.Duration.ofSeconds(1);
        private int numberOfGroups=1;
        private int numOfEventsToBeProcessedForBatch;
        private Coder<BuilderInputT> elemCoder;
        private ClientCall<BuilderInputT, BuilderOutpuT> clientCall;

        public Builder(ClientCall<BuilderInputT, BuilderOutpuT> clientCall, Coder<BuilderInputT> elemCoder, int numOfEventsToBeProcessedForBatch) {
            this.clientCall = clientCall;
            this.elemCoder = elemCoder;
            this.numOfEventsToBeProcessedForBatch = numOfEventsToBeProcessedForBatch;
        }

        public Builder<BuilderInputT, BuilderOutpuT> withResetCounterInterval(java.time.Duration resetCounterInterval){
            this.resetCounterInterval = resetCounterInterval;
            return this;
        }

        public Builder<BuilderInputT, BuilderOutpuT> withBatchInterval(java.time.Duration batchInterval){
            this.batchInterval = batchInterval;
            return this;
        }

        public Builder<BuilderInputT, BuilderOutpuT> withNumberOfGroups(int numberOfGroups){
            this.numberOfGroups = numberOfGroups;
            return this;
        }

        public Builder<BuilderInputT, BuilderOutpuT> withKInRejectionProbability(int kInRejectionProbability){
            this.kInRejectionProbability=kInRejectionProbability;
            return this;
        }

        public DynamicThrottlingTransform<BuilderInputT, BuilderOutpuT> build(){
            return new DynamicThrottlingTransform<BuilderInputT, BuilderOutpuT>(this);
        }
    }

    /**
     * Result object that should pass to the throttlingTag and errorTag.
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
     * @param <InputT> Type of the event from the source.
     * @param <OutpuT> Type of the enriched event.
     */
    @FunctionalInterface
    public interface ClientCall<InputT, OutpuT> extends Serializable {
        OutpuT call(InputT n) throws Exception;
    }

    /**
     * The {com.google.cloud.pso.dataflowthrottling.DynamicThrottlingTransform} constructor provides the custom execution options passed by the client.
     * @param builder object which holds the user defined params.
     */
    public DynamicThrottlingTransform(Builder<InputT, OutputT> builder){
        this.numberOfGroups= builder.numberOfGroups;
        this.batchInterval= builder.batchInterval;
        this.resetCounterInterval= builder.resetCounterInterval;
        this.numOfEventsToBeProcessedForBatch= builder.numOfEventsToBeProcessedForBatch;
        this.kInRejectionProbability= builder.kInRejectionProbability;
        this.elemCoder= builder.elemCoder;
        this.clientCall= builder.clientCall;
    }

    /**
     * Collection of accepted requests response.
     * @return PCollection<ClientCallResponses>
     */
    public TupleTag<OutputT> getSuccessTag(){
        return successTag;
    }

    /**
     * Collection of request responses of all error codes except 200,429.
     * @return PCollection<ClientCall Responses Except 200and 429>
     */
    public TupleTag<Result<InputT>> getErrorTag(){
        return errorTag;
    }

    /**
     * Collection of rejected requests and Throttled requests.
     * @return PCollection<Error_429 and ThrottledRequests>
     */
    public TupleTag<Result<InputT>> getThrottlingTag(){
        return throttlingTag;
    }

    /**
     * The Dynamic throttling transform begins here.
     * @param input payload from the source.
     * @return PCollectionTuple of tuple tags.
     */
    @Override
    public PCollectionTuple expand(PCollection<InputT> input) {
        /**
         * {Grouping} It will segregate incoming events into single/multiple number of groups.
         */
        PCollection<KV<Integer, InputT>> groups=input.apply("Grouping", ParDo.of(new DoFn<InputT, KV<Integer, InputT>>() {
            @DoFn.ProcessElement
            public void processElement(ProcessContext context) {
                context.output(KV.of(ThreadLocalRandom.current().nextInt(1, numberOfGroups + 1), context.element()));
            }
        }));

        /**
         * {Throttling}: Payload won't be processed from client-side based on the rejection probability.
         * Process element will add the payload to the {incomingReqBagState}.
         */
        PCollectionTuple enriched = groups.apply("Throttling", ParDo.of(new DoFn<KV<Integer, InputT>, OutputT>() {
            @StateId("acceptedRequests")
            private final StateSpec<ValueState<Integer>> acceptedRequestsStateSpec =
                    StateSpecs.value(VarIntCoder.of());

            @StateId("incomingReqBagState")
            private final StateSpec<BagState<InputT>> incomingReqBagStateSpec =
                    StateSpecs.bag(elemCoder);

            @StateId("totalProcessedRequests")
            private final StateSpec<ValueState<Integer>> totalProcessedRequestsStateSpec =
                    StateSpecs.value(VarIntCoder.of());

            @TimerId("resetCountsTimer")
            private final TimerSpec resetCountsTimerSpec = TimerSpecs
                    .timer(TimeDomain.EVENT_TIME);

            @TimerId("incomingReqBagTimer")
            private final TimerSpec incomingReqBagTimerSpec = TimerSpecs
                    .timer(TimeDomain.EVENT_TIME);

            @StateId("rejRequests")
            private final StateSpec<ValueState<Integer>> rejRequestsStateSpec =
                    StateSpecs.value(VarIntCoder.of());

            /**
             * @param context Payload that should be sent by the client.
             * @param totalProcessedRequests Counts the total number of requests processed by client.
             * @param incomingReqBagState BagState, which holds the requests to process in batch.
             * @param resetCountsTimer Timer that resets the counter for every n minutes.
             * @param incomingReqBagTimer Timer that is invoked for every N minutes irrespective of the bag size.
             * @throws IOException
             */
            @ProcessElement
            public void processElement(ProcessContext context,
                                       @StateId("acceptedRequests") ValueState<Integer> acceptedRequests,
                                       @StateId("totalProcessedRequests") ValueState<Integer> totalProcessedRequests,
                                       @StateId("incomingReqBagState") BagState<InputT> incomingReqBagState,
                                       @TimerId("resetCountsTimer") Timer resetCountsTimer,
                                       @TimerId("incomingReqBagTimer") Timer incomingReqBagTimer,
                                       @StateId("rejRequests") ValueState<Integer> rejRequests) throws IOException {

                if (incomingReqBagState.isEmpty().read()) {
                    incomingReqBagTimer.offset(Duration.millis(batchInterval.toMillis())).setRelative();
                }
                if (ObjectUtils.firstNonNull(totalProcessedRequests.read(), 0) == 0){
                    resetCountsTimer.offset(Duration.millis(resetCounterInterval.toMillis())).setRelative();
                }
                incomingReqBagState.add(context.element().getValue());
            }

            /**
             * Timer that processes n requests each time it get invokes.
             * @param context Payload that should be sent by the client.
             * @param acceptedRequests Counts the total number of requests processed by client and got accepted by the backend.
             * @param rejRequests Counts the total number of events that were rejected by client.
             */
            @OnTimer("incomingReqBagTimer")
            public void incomingReqBagTimer(
                    OnTimerContext context,
                    @StateId("acceptedRequests") ValueState<Integer> acceptedRequests,
                    @StateId("incomingReqBagState") BagState<InputT> incomingReqBagState,
                    @StateId("totalProcessedRequests") ValueState<Integer> totalProcessedRequests,
                    @TimerId("incomingReqBagTimer") Timer incomingReqBagTimer,
                    @StateId("rejRequests") ValueState<Integer> rejRequests){
                Iterable<InputT> bag=incomingReqBagState.read();

                double acceptedReqCount = ObjectUtils.firstNonNull(acceptedRequests.read(), 0);
                double totalReqCount = ObjectUtils.firstNonNull(totalProcessedRequests.read(), 0);
                int rejReqCount = ObjectUtils.firstNonNull(rejRequests.read(), 0);

                for(InputT value:Iterables.limit(bag, numOfEventsToBeProcessedForBatch)) {
                    //Calculate requests rejection probability
                    double reqRejectionProbability = (totalReqCount - (kInRejectionProbability * acceptedReqCount)) / (totalReqCount + 1);
                    double randomValue=Math.random();
                    OutputT successTagValue;
                    boolean accepted=TRUE;
                    Result<InputT> result;
                    if ((reqRejectionProbability) <= randomValue) {
                        totalReqCount=totalReqCount+1;
                        totalProcessedRequests.write((int)totalReqCount);
                        try {
                            successTagValue=clientCall.call(value);
                            acceptedReqCount=acceptedReqCount+1;
                            acceptedRequests.write((int)acceptedReqCount);
                            context.output(successTag, successTagValue);
                        } catch (ThrottlingException e){
                            context.output(throttlingTag, result=new Result<>(value, e.getMessage()));
                            accepted=FALSE;
                            //rejReqCount=rejReqCount+1;
                            //rejRequests.write((int)rejReqCount);
                        } catch (Exception e) {
                            accepted=FALSE;
                            context.output(errorTag, result=new Result<>(value, e.getMessage()));
                        }
                    } else {
                        accepted=FALSE;
                        context.output(throttlingTag, result=new Result<>(value, "Throttled by Client. Request rejection probability: "+reqRejectionProbability));
                    }
                    LOG.info("  totalCount-" +totalReqCount +",  reqRejecProb-"+reqRejectionProbability+",  Random-"+randomValue+", "+accepted+",  acceptCount-" +acceptedReqCount);
                }

                incomingReqBagState.clear();
                for(InputT b: Iterables.skip(bag, numOfEventsToBeProcessedForBatch)){
                    incomingReqBagState.add(b);
                }
                incomingReqBagTimer.offset(Duration.millis(batchInterval.toMillis())).setRelative();
            }

            /**
             * Timer that reset counter when ever it's get invoked.
             */
            @OnTimer("resetCountsTimer")
            public void resetCountsTimer(
                    OnTimerContext c,
                    @StateId("totalProcessedRequests") ValueState<Integer> totalProcessedRequests,
                    @StateId("acceptedRequests") ValueState<Integer> acceptedRequests,
                    @TimerId("resetCountsTimer") Timer resetCountsTimer){
                totalProcessedRequests.clear();
                acceptedRequests.clear();
                resetCountsTimer.offset(Duration.millis(resetCounterInterval.toMillis())).setRelative();
            }
        }).withOutputTags(successTag, TupleTagList.of(errorTag).and(throttlingTag)));
        return enriched;
    }
}
