package com.google.cloud.pso.util;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.api.services.bigquery.model.TableRow;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.transforms.DoFn.ProcessElement;
import org.apache.beam.sdk.values.KV;
import org.joda.time.Instant;

/**
 * The {@link JsonEventMatcher} builds the connection to BigQuery schema as well as validating
 * incoming JSON file with the schema in BigQuery.
 */
public class ConvertEventToGenericFailureRow extends DoFn<KV<String, String>, TableRow> {
  private String reason;

  public ConvertEventToGenericFailureRow(String reason) {
    this.reason = reason;
  }

  @ProcessElement
  public void processElement(ProcessContext context) {
    KV<String, String> element = context.element();
    TableRow row = new TableRow();
    JsonFactory factory = new JsonFactory();
    ObjectMapper mapper = new ObjectMapper(factory);
    try {
      JsonNode rootNode = mapper.readTree(element.getValue());

      row.put(Constants.EVENT_NAME, element.getKey());
      row.put(Constants.LAST_UPDATED_TIMESTAMP, new Instant().toString());
      row.put(Constants.REASON, reason);

      ((ObjectNode) rootNode).remove(Constants.LAST_UPDATED_TIMESTAMP);
      row.put(Constants.EVENT_BODY, rootNode.toString());
    } catch (JsonProcessingException e) {
      e.printStackTrace();
    }
    context.output(row);
  }
}
