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

package com.google.cloud.demo.iot.nirvana.frontend.shared;

import com.github.rholder.retry.RetryException;
import com.github.rholder.retry.Retryer;
import com.github.rholder.retry.RetryerBuilder;
import com.github.rholder.retry.StopStrategies;
import com.github.rholder.retry.WaitStrategies;
import com.google.appengine.api.taskqueue.Queue;
import com.google.appengine.api.taskqueue.QueueFactory;
import com.google.appengine.api.taskqueue.TaskOptions;
import com.google.appengine.api.taskqueue.TaskOptions.Method;
import com.google.appengine.api.utils.SystemProperty;
import com.google.common.base.Throwables;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.security.MessageDigest;
import java.util.Map;
import java.util.Properties;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import org.apache.commons.codec.binary.Hex;
import org.apache.commons.io.IOUtils;

/** Class that describes functions used throughout the application */
public class Utils {

  private static final Logger LOG = Logger.getLogger(Utils.class.getName());
  private static final Gson GSON = new Gson();
  private static final String APP_ENGINE_PROPERTIES_FILE = "/config/client.properties";

  /**
   * Check if the app is running in production or in local dev
   *
   * @return true if it is in production, false otherwise
   */
  public static boolean isGaeProduction() {
    return SystemProperty.environment.value() == SystemProperty.Environment.Value.Production;
  }

  /**
   * Check if the running environment is the dev
   *
   * @return true if it is the dev, false otherwise
   */
  public static boolean isGaeDevEnvironment() {
    return !isGaeProduction();
  }

  /**
   * Get input parameters if they are stored in JSON format
   *
   * @param req
   * @return
   * @throws IOException
   */
  public static Map<String, String> getRequestParameters(HttpServletRequest req)
      throws IOException {
    // read input data
    InputStream is = req.getInputStream();
    String inputParams = IOUtils.toString(is, "UTF-8");
    Type type = new TypeToken<Map<String, String>>() {}.getType();
    Map<String, String> map = GSON.fromJson(inputParams, type);

    return map;
  }

  /**
   * Get execution task of a task
   *
   * @param req the request of the task
   * @return the execution time of a task if exist
   */
  public static int getExecutionCount(HttpServletRequest req) {
    String header = req.getHeader("X-AppEngine-TaskExecutionCount");
    if (header != null && !header.isEmpty()) {
      return Integer.parseInt(header);
    }
    return 0;
  }

  /**
   * Get execution task name
   *
   * @param req the request of the task
   * @return the execution time of a task if exist
   */
  public static String getExecutionName(HttpServletRequest req) {
    String header = req.getHeader("X-AppEngine-TaskName");
    if (header == null) {
      return null;
    } else {
      return header;
    }
  }

  /**
   * Enqueue a task into Google App Engine
   *
   * @param queueName the name of the queue where to enqueue the task
   * @param taskUrl the URL of the task to be enqueued
   * @param taskName the name of the task to be enqueued
   * @param method the method to use (POST/GET)
   * @param parametersMap the parameters to be added to the task
   * @param delay the eventual delay to add to the task
   */
  public static void enqueueTask(
      String queueName,
      String taskUrl,
      String taskName,
      Method method,
      Map<String, String> parametersMap,
      long delay) {

    // prepare task options
    final TaskOptions taskOptions =
        TaskOptions.Builder.withUrl(taskUrl).taskName(taskName).method(method);

    // add parameters
    for (String key : parametersMap.keySet()) {
      taskOptions.param(key, parametersMap.get(key));
    }

    // add eventual delay
    if (delay > 0) {
      taskOptions.countdownMillis(delay);
    }

    // create the queue
    final Queue queue = QueueFactory.getQueue(queueName);

    Callable<Boolean> callable =
        new Callable<Boolean>() {
          public Boolean call() throws Exception {
            queue.add(taskOptions);
            return true;
          }
        };

    Retryer<Boolean> retryer =
        RetryerBuilder.<Boolean>newBuilder()
            .retryIfException()
            .withWaitStrategy(WaitStrategies.exponentialWait(100, 5, TimeUnit.MINUTES))
            .withStopStrategy(StopStrategies.stopAfterAttempt(5))
            .build();
    try {
      retryer.call(callable);
    } catch (RetryException e) {
      LOG.warning("enqueueTask() failed.\nStackTrace: " + Throwables.getStackTraceAsString(e));
    } catch (ExecutionException e) {
      LOG.warning("enqueueTask() failed.\nStackTrace: " + Throwables.getStackTraceAsString(e));
    }

    return;
  }

  /**
   * Read property from property file
   *
   * @param ctx ServletContext
   * @param propertyName the name of the property that you want to read
   * @return the value of the property
   */
  public static String getAppEngineProperty(ServletContext ctx, String propertyName) {
    try {
      InputStream is = ctx.getResourceAsStream(APP_ENGINE_PROPERTIES_FILE);
      Properties props = new Properties();
      props.load(is);
      return props.getProperty(propertyName);
    } catch (Exception ex) {
      LOG.severe(Throwables.getStackTraceAsString(ex));
    }
    return null;
  }

  /**
   * Compute MD5 of input value
   *
   * @param inputValue the value for which you want to compute MD5 hash
   * @return MD5 hash of the input string
   */
  public static String md5(String inputValue) {
    try {
      MessageDigest md = MessageDigest.getInstance("MD5");
      return new String(Hex.encodeHex(md.digest(inputValue.getBytes("UTF-8")))).toUpperCase();
    } catch (Exception ex) {
      LOG.severe(Throwables.getStackTraceAsString(ex));
    }
    return null;
  }
}
