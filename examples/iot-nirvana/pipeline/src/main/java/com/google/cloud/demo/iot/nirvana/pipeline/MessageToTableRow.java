/*
 * Copyright (C) 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package com.google.cloud.demo.iot.nirvana.pipeline;

import com.google.api.services.bigquery.model.TableFieldSchema;
import com.google.api.services.bigquery.model.TableRow;
import com.google.api.services.bigquery.model.TableSchema;
import com.google.cloud.demo.iot.nirvana.common.Message;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.TimeZone;
import org.apache.beam.sdk.transforms.DoFn;

/** Transformation converting a message from JSON to TableRow format for writing into BigQuery */
public class MessageToTableRow extends DoFn<Message, TableRow> {

  private TimeZone timeZone;

  /**
   * Constructor in charge of setting the time zone for the timestamp formatting operations that are
   * done in this pipeline step.
   *
   * @param timeZone
   */
  public MessageToTableRow(String timeZone) {
    this.timeZone = TimeZone.getTimeZone(timeZone);
  }

  @ProcessElement
  public void processElement(ProcessContext c) {
    // Read the next message to process
    Message message = c.element();

    // Create a TableRow from the temperature Message
    final SimpleDateFormat df = createDateFormat("YYYY-MM-dd'T'HH:mm:ss.SSS");
    final SimpleDateFormat df_year = createDateFormat("YYYY");
    final SimpleDateFormat df_month = createDateFormat("MM");
    final SimpleDateFormat df_day = createDateFormat("dd");
    final SimpleDateFormat df_hour = createDateFormat("HH");
    final SimpleDateFormat df_minute = createDateFormat("mm");
    final SimpleDateFormat df_second = createDateFormat("ss");
    final SimpleDateFormat df_frame = createDateFormat("SSS");
    Date messageTimestamp = new Date(message.getTimestamp());
    TableRow row =
        new TableRow()
            .set("Id", message.getId())
            .set("City", message.getCity())
            .set("Lat", String.valueOf(message.getLat()))
            .set("Lng", String.valueOf(message.getLng()))
            .set("Temperature", String.valueOf(message.getTemperature()))
            .set("Time", df.format(messageTimestamp))
            .set("Year", df_year.format(messageTimestamp))
            .set("Month", df_month.format(messageTimestamp))
            .set("Day", df_day.format(messageTimestamp))
            .set("Hour", df_hour.format(messageTimestamp))
            .set("Minute", df_minute.format(messageTimestamp))
            .set("Second", df_second.format(messageTimestamp))
            .set("Frame", df_frame.format(messageTimestamp));

    c.output(row);
  }

  /** Creates a date format for a specific pattern with the correct time zone. */
  SimpleDateFormat createDateFormat(String pattern) {
    SimpleDateFormat dateFormat = new SimpleDateFormat(pattern);
    dateFormat.setTimeZone(timeZone);
    return dateFormat;
  }

  /** Create the schema of the BigQuery table storing the temperatures */
  public static TableSchema getSchema() {
    return new TableSchema()
        .setFields(
            new ArrayList<TableFieldSchema>() {
              // Compose the list of TableFieldSchema from tableSchema.
              {
                add(new TableFieldSchema().setName("ID").setType("STRING"));
                add(new TableFieldSchema().setName("City").setType("STRING"));
                add(new TableFieldSchema().setName("Lat").setType("STRING"));
                add(new TableFieldSchema().setName("Lng").setType("STRING"));
                add(new TableFieldSchema().setName("Temperature").setType("STRING"));
                add(new TableFieldSchema().setName("Time").setType("DATETIME"));
                add(new TableFieldSchema().setName("Year").setType("INTEGER"));
                add(new TableFieldSchema().setName("Month").setType("INTEGER"));
                add(new TableFieldSchema().setName("Day").setType("INTEGER"));
                add(new TableFieldSchema().setName("Hour").setType("INTEGER"));
                add(new TableFieldSchema().setName("Minute").setType("INTEGER"));
                add(new TableFieldSchema().setName("Second").setType("INTEGER"));
                add(new TableFieldSchema().setName("Frame").setType("INTEGER"));
              }
            });
  }
}
