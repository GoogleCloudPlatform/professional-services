package com.google.cloud.pso.util;

import com.google.api.services.bigquery.model.TableRow;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.apache.beam.sdk.io.gcp.bigquery.TableRowJsonCoder;
import org.apache.beam.sdk.coders.Coder.Context;

public class BigQueryConverters {

  /**
   * Converts a JSON string to a {@link TableRow} object. If the data fails to convert, a {@link
   * RuntimeException} will be thrown.
   *
   * @param json The JSON string to parse.
   * @return The parsed {@link TableRow} object.
   */
  public static TableRow convertJsonToTableRow(String json) {
    TableRow row;
    // Parse the JSON into a {@link TableRow} object.
    try (InputStream inputStream =
        new ByteArrayInputStream(json.getBytes(StandardCharsets.UTF_8))) {
      row = TableRowJsonCoder.of().decode(inputStream, Context.OUTER);

    } catch (IOException e) {
      throw new RuntimeException("Failed to serialize json to table row: " + json, e);
    }

    return row;
  }
}
