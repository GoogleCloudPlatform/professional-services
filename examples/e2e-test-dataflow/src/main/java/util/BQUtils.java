package util;

import com.google.cloud.bigquery.BigQuery;
import com.google.cloud.bigquery.BigQueryOptions;
import com.google.cloud.bigquery.FieldValueList;
import com.google.cloud.bigquery.QueryJobConfiguration;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.util.logging.Logger;

public class BQUtils {
    private static final BigQuery bigquery = BigQueryOptions.getDefaultInstance().getService();
    private final static Logger LOGGER = Logger.getLogger(MyBashExecutor.class.getName());

    public static Iterable<FieldValueList> getResult(String query) throws Exception {
        LOGGER.info(String.format("Query to execute {} ",query));
        QueryJobConfiguration queryConfig = QueryJobConfiguration.newBuilder(query).build();
        return bigquery.query(queryConfig).iterateAll();
    }
}
