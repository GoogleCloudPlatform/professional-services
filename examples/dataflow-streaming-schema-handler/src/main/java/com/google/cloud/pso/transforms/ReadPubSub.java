package com.google.cloud.pso.transforms;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Iterator;
import java.util.Map.Entry;
import org.apache.beam.sdk.transforms.DoFn;
import org.apache.beam.sdk.values.KV;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ReadPubSub extends DoFn<String, KV<String, String>> {
  private static final Logger LOG = LoggerFactory.getLogger(ReadPubSub.class);

  @ProcessElement
  public void processElement(ProcessContext context) {
    String input = context.element();

    JsonFactory factory = new JsonFactory();
    ObjectMapper mapper = new ObjectMapper(factory);
    JsonNode rootNode;
    try {
      rootNode = mapper.readTree(input);
      Iterator<Entry<String, JsonNode>> fieldsIterator = rootNode.fields();
      Entry<String, JsonNode> field = fieldsIterator.next();

      context.output(KV.of(field.getKey(), field.getValue().toString()));
    } catch (JsonProcessingException e) {
      LOG.error("Unable to parse JSON Message, check the format of the JSON", e);
    }
  }
}
