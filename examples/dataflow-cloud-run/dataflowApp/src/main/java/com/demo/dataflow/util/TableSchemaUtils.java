package com.demo.dataflow.util;

import com.google.api.client.json.JsonParser;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.bigquery.model.TableFieldSchema;
import com.google.api.services.bigquery.model.TableSchema;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

public  class  TableSchemaUtils {
    public static TableSchema readSchema(String fileName) throws Exception{
        InputStream ioStream = TableSchemaUtils.class.getResourceAsStream(fileName);
        List<TableFieldSchema> fields = new ArrayList<TableFieldSchema>();
        JsonParser parser = JacksonFactory.getDefaultInstance().createJsonParser(ioStream);
        parser.parseArrayAndClose(fields, TableFieldSchema.class);
        return new TableSchema().setFields(fields);
    }
}
