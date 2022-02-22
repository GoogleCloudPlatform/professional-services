/*
 * Copyright (C) 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.google.cloud.pso.dataflowthrottling;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpContext;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpPrincipal;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;

/**
 * This is test backend server with throttling capabilities.
 */
public class HttpServerThrottling {

    static int a = 0;

    public static void main(String[] args) throws IOException, InterruptedException {
        HttpServer server = HttpServer.create(new InetSocketAddress(args[0], 8500), 0);
        HttpContext context = server.createContext("/");

        context.setHandler(HttpServerThrottling::handleRequest);
        server.start();
        while (true) {
            long millis = System.currentTimeMillis();
            //code to run
            a = 0;
            Thread.sleep(5000 - millis % 1000);
        }
    }

    private static void handleRequest(HttpExchange exchange) throws IOException {
        String response;
        String request;
        int b;
        StringBuilder stringBuilder;

        printRequestInfo(exchange);

        InputStream is = exchange.getRequestBody();
        stringBuilder = new StringBuilder();
        while ((b = is.read()) != -1) {
            stringBuilder.append((char) b);
        }
        is.close();

        if (stringBuilder.length() > 0) {
            request = URLDecoder.decode(stringBuilder.toString(), "UTF-8");
        } else {
            request = "There is no body";
        }
        stringBuilder = new StringBuilder();
        stringBuilder.append(request);
        response = stringBuilder.toString();

        a++;
        System.out.println(a);
        if (a < 100 || a > 500) {
            exchange.sendResponseHeaders(200, response.getBytes().length);//response code and length
        } else {
            exchange.sendResponseHeaders(429, response.getBytes().length);//response code and length
        }
        OutputStream outputStream = exchange.getResponseBody();
        outputStream.write(response.getBytes());
        outputStream.close();
    }

    private static void printRequestInfo(HttpExchange exchange) {
        System.out.println("-- headers --");
        Headers requestHeaders = exchange.getRequestHeaders();
        requestHeaders.entrySet().forEach(System.out::println);

        System.out.println("-- principle --");
        HttpPrincipal principal = exchange.getPrincipal();
        System.out.println(principal);

        System.out.println("-- HTTP method --");
        String requestMethod = exchange.getRequestMethod();
        System.out.println(requestMethod);

        System.out.println("-- query --");
        URI requestURI = exchange.getRequestURI();
        String query = requestURI.getQuery();
        System.out.println(query);

        System.out.print("\n\n\n\n\n");
    }

}
