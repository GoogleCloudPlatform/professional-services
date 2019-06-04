/*
 * Copyright (C) 2019 Google Inc.
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

package com.google.cloud.demo.hangouts.chat.bot.shared;

import com.github.rholder.retry.*;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.http.HttpMethods;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.chat.v1.HangoutsChat;
import com.google.appengine.api.taskqueue.Queue;
import com.google.appengine.api.taskqueue.QueueFactory;
import com.google.appengine.api.taskqueue.TaskOptions;
import com.google.appengine.api.taskqueue.TaskOptions.Method;
import com.google.appengine.api.utils.SystemProperty;
import com.google.common.base.Throwables;
import com.google.gson.Gson;
import com.google.gson.JsonParser;
import com.google.gson.reflect.TypeToken;
import org.apache.commons.codec.binary.Hex;
import org.apache.commons.io.IOUtils;
import org.jsoup.Jsoup;
import org.w3c.dom.Document;
import org.xml.sax.SAXException;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.*;
import java.lang.reflect.Type;
import java.net.HttpURLConnection;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLConnection;
import java.security.MessageDigest;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Class that describes functions used throughout the application
 */
public class Utils {

    private static final Logger LOG = Logger.getLogger(Utils.class.getName());
    private static final Gson GSON = new Gson();
    private static final String APP_ENGINE_PROPERTIES_FILE = "/config/app.properties";
    private static final String GAE_URL_BASE_LOCALHOST="http://localhost";
    private static HangoutsChat hcService=null;
    private static final HttpTransport HTTP_TRANSPORT = new NetHttpTransport();
    private static final JacksonFactory JSON_FACTORY = new JacksonFactory();

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
     * Get AppEngine base URL (if local default value will be returned
     * @param ctx the Servlet context from where this function will be called
     * @return
     */
    public static String getGaeBaseUrl(ServletContext ctx) {
        String hostUrl;
        if (isGaeProduction()) {
            String applicationId = System.getProperty("com.google.appengine.application.id");
            hostUrl = "https://" + applicationId + ".appspot.com/";
            return hostUrl;
        }
        //return default variable for local environment
        return GAE_URL_BASE_LOCALHOST+":"+getAppEngineProperty(ctx,"appengine.localhost.port");
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
        Type type = new TypeToken<Map<String, String>>() {
        }.getType();
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
     * @param queueName     the name of the queue where to enqueue the task
     * @param taskUrl       the URL of the task to be enqueued
     * @param taskName      the name of the task to be enqueued
     * @param method        the method to use (POST/GET)
     * @param parametersMap the parameters to be added to the task
     * @param delay         the eventual delay to add to the task
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
     * @param ctx          ServletContext
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

    /**
     * Get JSON payload
     *
     * @param request the request that has to be processed
     * @return payload of the request
     * @throws IOException
     */
    public static String getJsonPayload(HttpServletRequest request) throws IOException {
        JsonParser jsonParser = new JsonParser();
        String body = null;
        StringBuilder stringBuilder = new StringBuilder();
        BufferedReader bufferedReader = null;

        try {
            InputStream inputStream = request.getInputStream();
            if (inputStream != null) {
                bufferedReader = new BufferedReader(new InputStreamReader(inputStream));
                char[] charBuffer = new char[128];
                int bytesRead = -1;
                while ((bytesRead = bufferedReader.read(charBuffer)) > 0) {
                    stringBuilder.append(charBuffer, 0, bytesRead);
                }
            } else {
                stringBuilder.append("");
            }
        } catch (IOException ex) {
            throw ex;
        } finally {
            if (bufferedReader != null) {
                try {
                    bufferedReader.close();
                } catch (IOException ex) {
                    throw ex;
                }
            }
        }

        body = stringBuilder.toString();
        return body;
    }

    /**
     * Reads the RSS data from a given {@code URL}.</p>
     *
     * @param url the {@code URL} to read from.
     * @return the the document at the given {@code URL}.
     */
    public static Document readRSS(URL url) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            DocumentBuilder builder = factory.newDocumentBuilder();
            URLConnection con = url.openConnection();
            Document doc = builder.parse(con.getInputStream());
            doc.normalizeDocument();
            return doc;
        } catch (ParserConfigurationException e) {
            e.printStackTrace();
        } catch (SAXException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Generate feed ID from feed name
     *
     * @param name the name you are going to set to the feed
     * @return the ID will be used as ID in DataStore
     */
    public static String getReleaseNotesFeedEntityId(String name) {
        return name.replaceAll("\\s", "").toLowerCase();
    }

    /**
     * Perform API call
     *
     * @param url     url that you want to call
     * @param method  GET/POST
     * @param payload eventual payload. Null if empty
     * @return response of the remote object
     * @throws IOException
     */
    public static String apiCall(String url, String method, String payload) throws IOException {
        URL myURL = new URL(url);
        HttpURLConnection conn = (HttpURLConnection) myURL.openConnection();
        conn.setRequestMethod(method);
        conn.setInstanceFollowRedirects(false);
        conn.setConnectTimeout(1000 * 60);

        //manage POST connection and input parameters
        if(method.equals(HttpMethods.POST)) {
            conn.setDoOutput(true);
            OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream());
            if (payload != null) {
                writer.write(payload);
                writer.close();
            }
        }


        int respCode = conn.getResponseCode();
        if (respCode == HttpURLConnection.HTTP_OK || respCode == HttpURLConnection.HTTP_NOT_FOUND) {
            StringBuffer response = new StringBuffer();
            String line;

            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();
            return response.toString();

        } else {
            return (conn.getResponseCode() + " " + conn.getResponseMessage());
        }
    }

    /**
     * Convert HTML text in pure plain text
     * @param html
     * @return
     */
    public static String html2text(String html) {
        return Jsoup.parse(html).text();
    }


    /**
     * Create an HangoutsChat service
     * @return HangoutsChat service
     */
    public static HangoutsChat getHangoutsChatService(ServletContext ctx) throws IOException {
        if(hcService==null){
            //use AppEngine service account

            File jsonKey = null;
            try {
                jsonKey = new File(ctx.getResource("/WEB-INF/SA.json").toURI());
            }
            catch(URISyntaxException e){
                LOG.log(Level.SEVERE,"Error in reading JSON key",e);
                return null;
            }

            InputStream inputStream = new FileInputStream(jsonKey);
            GoogleCredential credential = GoogleCredential.fromStream(inputStream, HTTP_TRANSPORT, JSON_FACTORY).createScoped(Collections.singleton("https://www.googleapis.com/auth/chat.bot"));

            hcService= new HangoutsChat.Builder(HTTP_TRANSPORT, JSON_FACTORY, null)
                .setApplicationName("GRNU BOT")
                .setHttpRequestInitializer(credential)
                .build();
        }
        return hcService;
    }

    /**
     * Parse feed date
     * @param feedDate date to parse
     * @return date parsed date
     */
    public static Date parseFeedDate(String feedDate){
        List<SimpleDateFormat> listSdf=new ArrayList<SimpleDateFormat>();
            listSdf.add(new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSSSSXXX"));
            listSdf.add(new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX"));
        Date date=null;
        for(SimpleDateFormat sdf:listSdf){
            try{
                date=sdf.parse(feedDate);
                return date;
            }
            catch (ParseException e) {
                LOG.log(Level.WARNING,"Error in parsing date. Try next format.",e);
            }
        }

        //if it arrives here it means that there is no format working
        return date;
    }


    /**
     * Transform a general message into a new one that is compatible with ChatBOT limits
     * @param fullMessage
     * @return
     */
    public static String getCompatibleBotMessage(String fullMessage){
        final int MAX_BOT_MSG_CONTENT_LENGTH=4096;
        //set message
        String finalMessageToAdd=" [...] TRUNCATED - Check the website";
        if(fullMessage.length()>MAX_BOT_MSG_CONTENT_LENGTH){
            fullMessage=fullMessage.substring(0,MAX_BOT_MSG_CONTENT_LENGTH-finalMessageToAdd.length()-1)+finalMessageToAdd;
        }
        return fullMessage;
    }
}
