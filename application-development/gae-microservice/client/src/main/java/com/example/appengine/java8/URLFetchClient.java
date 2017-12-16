/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Application to demonstrate and test a microservice in App Engine. 
 */
package com.example.appengine.java8;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.text.DecimalFormat;
import java.util.logging.Logger;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Servlet connects to a microservice in another project by POSTing
 * data to a microservice and reading data back using native sockets,
 * which are supported in App Engine with Java 8. This avoids the use
 * of the App Engine specific URLFetch API, which was required in
 * Java 7. For details see 
 *
 * https://cloud.google.com/appengine/docs/standard/java/issue-requests
 */
@WebServlet(name = "URLFetchClient", value = "/urlfetchtest")
public class URLFetchClient extends HttpServlet {

  private static final int ITERATIONS = 10;
  private static final Logger logger = Logger.getLogger(URLFetchClient.class.getName());
  private static DecimalFormat df = new DecimalFormat(".#");

  @Override
  public void doGet(HttpServletRequest req, HttpServletResponse res)
      throws IOException {

    res.setContentType("text/html");
    logger.info("doGet enter");

    // Setup
    String filePath =  getServletContext().getRealPath("/static/zeros700k.dat");
    InputStream is = new FileInputStream(new File(filePath));
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    byte[] buffer = new byte[1024];
    int length;
    while ((length = is.read(buffer)) != -1) {
        baos.write(buffer, 0, length);
    }
    String dataToSend = baos.toString("UTF-8");

    // Call service with buffer
    URL url1 = new URL("https://alexamiesgo.appspot.com/receiveandsend");
    double[] latencyBuffering = new double[ITERATIONS];
    for (int i = 0; i < ITERATIONS; i++) {
      latencyBuffering[i] = sendAndReceive(req, res, dataToSend, url1);
    }

    // Call service with no buffer
    URL url2 = new URL("https://alexamiesgo.appspot.com/nobuffer");
    double[] latencyNoBuffering = new double[ITERATIONS];
    for (int i = 0; i < ITERATIONS; i++) {
      latencyNoBuffering[i] = sendAndReceive(req, res, dataToSend, url2);
    }
    
    // Results
    res.getWriter().println("<p>With buffering took:</p>");
    reportResults(res, latencyBuffering);
    res.getWriter().println("<p>With no buffering took:</p>");
    reportResults(res, latencyNoBuffering);

    logger.info("doGet exit");
  }

  /*
   * POSTs the data to an endpoint and read the response
   */
  private double sendAndReceive(HttpServletRequest req, HttpServletResponse res,
                              String dataToSend, URL url) throws IOException {

    // Send some data
    long start = System.nanoTime();
    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
    conn.setDoOutput(true);
    conn.setInstanceFollowRedirects(false);
    conn.setRequestMethod("POST");
    OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream());
    writer.write(URLEncoder.encode(dataToSend, "UTF-8"));
    writer.close();

    // Read some data
    int respCode = conn.getResponseCode();
    int bytesReceived = 0;
    if (respCode == HttpURLConnection.HTTP_OK) {
      req.setAttribute("error", "");
      ByteArrayOutputStream boas = new ByteArrayOutputStream();
      InputStream iStream = conn.getInputStream();
      byte[] incoming = new byte[1024];
      int l;
      while ((l = iStream.read(incoming)) != -1) {
        boas.write(incoming, 0, l);
      }
      String data = boas.toString();
      bytesReceived = data.length();
      req.setAttribute("response", data);
    } else {
      req.setAttribute("error", conn.getResponseCode() + " " + conn.getResponseMessage());
    }
    return (System.nanoTime() - start) / 1000000.0;
  }

  // Write min, mean, and max to the web client
  // Array latency must have at least one element
  private void reportResults(HttpServletResponse res, double[] latency) throws IOException {
    double sum = 0;
    double min = latency[0];
    double max = latency[0];
    for (double l : latency) {
      sum += l;
      if (l < min) {
        min = l;
      }
      if (l > max) {
        max = l;
      }
    }
    double mean = sum / latency.length;
    
    res.getWriter().println("<p>Min: " + df.format(min) + ", Mean: " + df.format(mean)
                            + ", Max: " + df.format(max) + "</p>");
  }

}
