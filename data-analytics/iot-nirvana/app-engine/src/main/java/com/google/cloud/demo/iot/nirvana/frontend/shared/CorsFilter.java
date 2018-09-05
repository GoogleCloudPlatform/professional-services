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

import java.io.IOException;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Servlet Filter implementation class CORSFilter */
public class CorsFilter implements Filter {

  private static final String GAE_DEV_ADDRESS = "http://localhost:8080";

  public CorsFilter() {}

  public void destroy() {}

  /** Add CORS headers to the HTTP response in development environment */
  public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain)
      throws IOException, ServletException {

    HttpServletResponse httpServletResponse = (HttpServletResponse) resp;
    if (!Utils.isGaeProduction()) {
      // Authorize CORS calls to localhost in development environment
      httpServletResponse.addHeader("Access-Control-Allow-Origin", GAE_DEV_ADDRESS);
    }
    httpServletResponse.addHeader("Access-Control-Allow-Credentials", "true");

    // Reply to HTTP OPTIONS request with ACCEPTED status
    HttpServletRequest httpServletRequest = (HttpServletRequest) req;
    if (httpServletRequest.getMethod().equals("OPTIONS")) {
      httpServletResponse.setStatus(HttpServletResponse.SC_ACCEPTED);
      return;
    }

    // Pass the request along the filter chain
    chain.doFilter(req, resp);
  }

  public void init(FilterConfig fConfig) throws ServletException {}
}
