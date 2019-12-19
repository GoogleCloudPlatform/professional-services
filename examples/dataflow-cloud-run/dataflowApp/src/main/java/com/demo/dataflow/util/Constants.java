package com.demo.dataflow.util;

import com.google.api.services.bigquery.model.TableFieldSchema;
import com.google.api.services.bigquery.model.TableSchema;
import com.google.common.collect.ImmutableList;

public class Constants {

    public static final String STRING = "STRING";
    public static final String NUMERIC = "NUMERIC";
    public static final String FLOAT = "FLOAT";
    public static final String INTEGER = "INTEGER";
    public static final String  GEOGRAPHY="GEOGRAPHY";


    public static final  TableSchema errorTableSchema =
            new TableSchema().setFields(ImmutableList.of(
                    new TableFieldSchema().setName("error_timestamp").setType(Constants.NUMERIC),
                    new TableFieldSchema().setName("error_message").setType(Constants.STRING),
                    new TableFieldSchema().setName("data_string").setType(Constants.STRING),
                    new TableFieldSchema().setName("correlation_id").setType(Constants.STRING)));
}
