/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.hive;


import com.google.cloud.pso.bqexternalviewgenerator.config.ViewGeneratorProperties;
import java.util.List;
import lombok.extern.log4j.Log4j2;
import org.apache.hadoop.hive.conf.HiveConf;
import org.apache.hadoop.hive.metastore.HiveMetaStoreClient;
import org.apache.hadoop.hive.metastore.api.MetaException;
import org.apache.hadoop.hive.metastore.api.Table;
import org.apache.thrift.TException;

// Using one metastore connection per call,
// This is done because multiple requests with one hive metastore connection was giving Socket
// Exceptions and out_of_seq errors from Metastore
// Note: There are chances of metastore_connection leakage due to this approach.
// https://issues.apache.org/jira/browse/HIVE-20600

@Log4j2
public class HiveMetaStoreService {
  HiveMetaStoreClient hiveMetaStoreClient;

  public HiveMetaStoreService(ViewGeneratorProperties configs) throws MetaException {
    HiveConf hiveConf = new HiveConf();
    hiveConf.setIntVar(HiveConf.ConfVars.METASTORETHRIFTCONNECTIONRETRIES, 3);
    hiveConf.setIntVar(HiveConf.ConfVars.METASTORETHRIFTFAILURERETRIES, 10);
    hiveConf.setVar(HiveConf.ConfVars.METASTOREURIS, configs.hive.thriftUris);
    // Only one connection is used per metastore call to prevent multiple issues
    hiveConf.setIntVar(HiveConf.ConfVars.METASTORE_CONNECTION_POOLING_MAX_CONNECTIONS, 1);

    this.hiveMetaStoreClient = new HiveMetaStoreClient(hiveConf);

    // Testing with below undeprecated configs, resulted in multiple dependency additions with
    // different errors
    // Skipping for now.

    // Configuration metastoreConf = MetastoreConf.newMetastoreConf();
    // metastoreConf.set(MetastoreConf.ConfVars.THRIFT_FAILURE_RETRIES.getVarname(),"3");
    // metastoreConf.set(MetastoreConf.ConfVars.THRIFT_URI_SELECTION.getVarname(),
    // hiveProperties.thriftUris);
    // hiveMetaStoreConnector = new HiveMetaStoreConnector(metastoreConf);

  }

  public void closeMetaStoreConnection() {
    hiveMetaStoreClient.close();
  }

  public List<String> getAllDatabases() throws TException {
    return hiveMetaStoreClient.getAllDatabases();
  }

  public List<String> getAllTables(String dbName) throws TException {
    return hiveMetaStoreClient.getAllTables(dbName);
  }

  public Table getTable(String dbName, String tableName) throws TException {
    return hiveMetaStoreClient.getTable(dbName, tableName);
  }
}
