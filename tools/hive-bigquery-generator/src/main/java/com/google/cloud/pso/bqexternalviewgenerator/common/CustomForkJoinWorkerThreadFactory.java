/*
 * Copyright 2022 Google
 * This software is provided as-is, without warranty or representation for any use or purpose. 
 * Your use of it is subject to your agreement with Google.
 */

package com.google.cloud.pso.bqexternalviewgenerator.common;


import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ForkJoinPool.ForkJoinWorkerThreadFactory;
import java.util.concurrent.ForkJoinWorkerThread;

// This class is to fix the following exception. Forkpooljoin workers don't manage class states well
// Caused by: java.lang.ClassNotFoundException: Class
// org.apache.hadoop.hive.metastore.DefaultMetaStoreFilterHookImpl not found
//     at org.apache.hadoop.conf.Configuration.getClassByName(Configuration.java:2592)

public class CustomForkJoinWorkerThreadFactory implements ForkJoinWorkerThreadFactory {

  @Override
  public final ForkJoinWorkerThread newThread(ForkJoinPool pool) {
    return new MyForkJoinWorkerThread(pool);
  }

  private static class MyForkJoinWorkerThread extends ForkJoinWorkerThread {

    private MyForkJoinWorkerThread(final ForkJoinPool pool) {
      super(pool);
      setContextClassLoader(Thread.currentThread().getContextClassLoader());
    }
  }
}
