/*
 * Copyright 2020 Google LLC
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
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.ParDo;
import org.apache.beam.sdk.values.PCollection;
import org.apache.beam.sdk.values.PCollectionTuple;
import org.apache.beam.sdk.values.TupleTag;
import org.apache.beam.sdk.values.TupleTagList;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.Reader;
import java.io.StringReader;
import java.util.UUID;

public  class ParseGoBikeEvents extends DoFn<String, GoBike> {

    private static final Logger LOG = LoggerFactory.getLogger(ParseGoBikeEvents.class);
    private static final CSVFormat format = CSVFormat.DEFAULT.withHeader(GoBike.getHeader());

    public static final TupleTag<GoBike> successTag = new TupleTag<GoBike>() {};
    public static final TupleTag<FailedMessage> deadLetterTag = new TupleTag<FailedMessage>() {};
    public static PCollectionTuple process(PCollection<String> csvLines) {
        return csvLines.apply("Parse PDC Data and Extract Information", ParDo.of(new DoFn<String, GoBike>() {
            @ProcessElement
            public void processElement(ProcessContext processContext) {
                    try {
                        Reader input = new StringReader(processContext.element());
                        CSVParser parser = new CSVParser(input, format);
                        CSVRecord record  = parser.getRecords().get(0);
                        if (! record.get(GoBike.getHeader()[0]).equals(GoBike.getHeader()[0]))
                            processContext.output(successTag, GoBike.createFromMap(record.toMap()));
                    } catch (Exception exception) {
                        /**
                         * Error logs only contains the correlation Id. The message in deadLetterTag is persisted in BigQuery in this example
                         * that contains error message and the data string that was being processed when we encountered the error.
                         */
                        String corelationId = UUID.randomUUID().toString();
                        LOG.error("{} {}", ErrorCodes.CSV_CONVERSION_ERROR);
                        processContext.output(deadLetterTag, FailedMessage.create(System.currentTimeMillis(), exception.getMessage(), processContext.element(), corelationId));
                    }
                }
        }).withOutputTags(successTag, TupleTagList.of(deadLetterTag)));
    }

}