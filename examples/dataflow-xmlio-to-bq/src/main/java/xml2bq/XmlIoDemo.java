/*
 * Copyright (C) 2021 Google Inc.
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
package com.google.cloud.pso.xml2bq;

import com.google.api.services.bigquery.model.TableFieldSchema;
import com.google.api.services.bigquery.model.TableRow;
import com.google.api.services.bigquery.model.TableSchema;
import java.util.Arrays;
import org.apache.beam.sdk.Pipeline;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO.Write.CreateDisposition;
import org.apache.beam.sdk.io.gcp.bigquery.BigQueryIO.Write.WriteDisposition;
import org.apache.beam.sdk.io.xml.XmlIO;
import org.apache.beam.sdk.options.Description;
import org.apache.beam.sdk.options.PipelineOptions;
import org.apache.beam.sdk.options.PipelineOptionsFactory;
import org.apache.beam.sdk.options.Validation.Required;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.ParDo;

public class XmlIoDemo {

  static void runXmlIoDemo(XmlIoDemoOptions options) {
    TableSchema schema =
        new TableSchema()
            .setFields(
                Arrays.asList(
                    new TableFieldSchema()
                        .setName("customerID")
                        .setType("STRING")
                        .setMode("NULLABLE"),
                    new TableFieldSchema()
                        .setName("employeeID")
                        .setType("String")
                        .setMode("NULLABLE"),
                    new TableFieldSchema()
                        .setName("orderDate")
                        .setType("String")
                        .setMode("NULLABLE"),
                    new TableFieldSchema()
                        .setName("requiredDate")
                        .setType("String")
                        .setMode("NULLABLE"),
                    new TableFieldSchema()
                        .setName("shipInfo")
                        .setType("STRUCT")
                        .setFields(
                            Arrays.asList(
                                new TableFieldSchema()
                                    .setName("shipVia")
                                    .setType("String")
                                    .setMode("NULLABLE"),
                                new TableFieldSchema()
                                    .setName("Freight")
                                    .setType("FLOAT64")
                                    .setMode("NULLABLE"),
                                new TableFieldSchema()
                                    .setName("shipName")
                                    .setType("String")
                                    .setMode("NULLABLE"),
                                new TableFieldSchema()
                                    .setName("shipAddress")
                                    .setType("String")
                                    .setMode("NULLABLE"),
                                new TableFieldSchema()
                                    .setName("shipCity")
                                    .setType("String")
                                    .setMode("NULLABLE"),
                                new TableFieldSchema()
                                    .setName("shipRegion")
                                    .setType("String")
                                    .setMode("NULLABLE"),
                                new TableFieldSchema()
                                    .setName("shipPostalCode")
                                    .setType("String")
                                    .setMode("NULLABLE"),
                                new TableFieldSchema()
                                    .setName("shipCountry")
                                    .setType("String")
                                    .setMode("NULLABLE"),
                                new TableFieldSchema()
                                    .setName("shippedDate")
                                    .setType("String")
                                    .setMode("NULLABLE")))));

    Pipeline p = Pipeline.create(options);
    p.apply(
            "Read XML",
            XmlIO.<Order>read()
                .from(options.getInputFile())
                .withRootElement("Orders")
                .withRecordElement("Order")
                .withRecordClass(Order.class))
        .apply(
            "Process element",
            ParDo.of(
                new DoFn<Order, TableRow>() {
                  @ProcessElement
                  public void processElement(ProcessContext c) {
                    Order currentOrder = c.element();

                    TableRow row =
                        new TableRow()
                            .set("customerID", currentOrder.getCustomerID())
                            .set("employeeID", currentOrder.getEmployeeID())
                            .set("orderDate", currentOrder.getOrderDate())
                            .set("requiredDate", currentOrder.getRequiredDate())
                            .set("shipInfo", currentOrder.getShipInfo());

                    c.output(row);
                  }
                }))
        .apply(
            "Write to BQ",
            BigQueryIO.writeTableRows()
                .to(options.getBqOutputPath())
                .withSchema(schema)
                .withCreateDisposition(CreateDisposition.CREATE_IF_NEEDED)
                .withWriteDisposition(WriteDisposition.WRITE_TRUNCATE));

    p.run().waitUntilFinish();
  }

  public static void main(String[] args) {
    XmlIoDemoOptions options =
        PipelineOptionsFactory.fromArgs(args).withValidation().as(XmlIoDemoOptions.class);
    runXmlIoDemo(options);
  }

  public interface XmlIoDemoOptions extends PipelineOptions {

    @Description("Path of the file to read from")
    @Required
    String getInputFile();

    void setInputFile(String value);

    @Description("BigQuery output path")
    @Required
    String getBqOutputPath();

    void setBqOutputPath(String value);
  }
}
