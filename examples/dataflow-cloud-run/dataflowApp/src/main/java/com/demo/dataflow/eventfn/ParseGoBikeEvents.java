/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.demo.dataflow.eventfn;

import com.demo.dataflow.model.FailedMessage;
import com.demo.dataflow.model.GoBike;
import com.demo.dataflow.util.ErrorCodes;
import org.apache.beam.sdk.metrics.Counter;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.TupleTag;
import org.apache.beam.sdk.values.TupleTagList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.UUID;


public class ParseGoBikeEvents extends DoFn<String, GoBike> {

    public static  String headers = "\"duration_sec\",\"start_time\",\"end_time\",\"start_station_id\",\"start_station_name\",\"start_station_latitude\",\"start_station_longitude\",\"end_station_id\",\"end_station_name\",\"end_station_latitude\",\"end_station_longitude\",\"bike_id\",\"user_type\",\"member_birth_year\",\"member_gender\",\"bike_share_for_all_trip\"";
    // Log and count parse errors.
    private static final Logger LOG = LoggerFactory.getLogger(ParseGoBikeEvents.class);

    public static TupleTag<GoBike> successTag = new TupleTag<GoBike>() {};
    public static TupleTag<FailedMessage> deadLetterTag = new TupleTag<FailedMessage>() {};

    public static PCollectionTuple process(PCollection<String> csvLines, Counter successCounter, Counter failureCounter) {
        return csvLines.apply("Parse PDC Data and Extract Information", ParDo.of(new DoFn<String, GoBike>() {
            @ProcessElement
            public void processElement(ProcessContext c) {
                if (!c.element().toString().equals(headers)) {
                    try {
                        String[] components = c.element().toString().split(",");
                        int durationSec = Integer.parseInt(components[0].replace("\"", ""));
                        String startTime = components[1].replace("\"", "");
                        String endTime = components[2].replace("\"", "");
                        Integer startStationId = components[3].replace("\"", "").equals("") ? null : Integer.parseInt(components[3].replace("\"", ""));
                        String startStationName = components[4].replace("\"", "");
                        String startStationLatitude = components[5].replace("\"", "").equals("") ? null : components[5].replace("\"", "");
                        String startStationLongitude = components[6].replace("\"", "").equals("") ? null : components[6].replace("\"", "");
                        Integer endStationId = components[7].replace("\"", "").equals("") ? null : Integer.parseInt(components[7].replace("\"", ""));
                        String endStationName = components[8].replace("\"", "");
                        String endStationLatitude = components[9].replace("\"", "").equals("") ? null : components[9].replace("\"", "");
                        String endStationLongitude = components[10].replace("\"", "").equals("") ? null : components[10].replace("\"", "");
                        int bikerId = components[11].replace("\"", "").equals("") ? null : Integer.parseInt(components[11].replace("\"", ""));
                        String userType = components[12].replace("\"", "");
                        Integer memeberBirthYear = components[13].replace("\"", "").equals("") ? null : Integer.parseInt(components[13].replace("\"", ""));
                        String memberGender = components[14].replace("\"", "");
                        Boolean bikeShareForAllTrip = components[15].replace("\"", "").equals("") ? null : Boolean.parseBoolean(components[15].replace("\"", ""));

                        GoBike gInfo = new GoBike(durationSec, startStationName, endStationName, startStationId, endStationId, startTime,
                                endTime, startStationLatitude, startStationLongitude, endStationLatitude, endStationLongitude, bikerId, userType,
                                memeberBirthYear, memberGender, bikeShareForAllTrip);
                        c.output(successTag, gInfo);
                        successCounter.inc();
                    } catch (Exception exception) {
                        failureCounter.inc();
                        String corelationId = UUID.randomUUID().toString();
                        StringBuffer stackTraceElement = new StringBuffer();
                        if (exception.getStackTrace() != null) {
                            StackTraceElement[] error = exception.getStackTrace();
                            for (StackTraceElement stack : error)
                                stackTraceElement.append(stack.toString());
                            LOG.error("{} {}", ErrorCodes.CONVERSION_EXCEPTION, stackTraceElement.toString());
                            c.output(deadLetterTag, new FailedMessage(System.currentTimeMillis(), stackTraceElement.toString(), c.element().toString(), corelationId));
                        } else {
                            LOG.error("{} {}", ErrorCodes.CONVERSION_EXCEPTION, stackTraceElement.toString());
                            c.output(deadLetterTag, new FailedMessage(System.currentTimeMillis(), exception.getMessage(), c.element().toString(), corelationId));
                        }
                    }
                }
            }
        }).withOutputTags(successTag, TupleTagList.of(deadLetterTag)));
    }

}