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

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.googleapis.auth.oauth2.GooglePublicKeysManager;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;

/** Servlet Filter implementation class CORSFilter */
public class JwtVerifyFilter implements Filter {

  private static final Logger LOG = Logger.getLogger(JwtVerifyFilter.class.getName());

  public JwtVerifyFilter() {}

  public void destroy() {}

  /** Add CORS headers to the HTTP response in development environment */
  public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain)
      throws IOException, ServletException {

    if(!Utils.isGaeProduction()){
      chain.doFilter(req, resp);
      return;
    }

    // Bearer Tokens received by bots will always specify this issuer.
    String CHAT_ISSUER = "chat@system.gserviceaccount.com";
    // Url to obtain the public certificate for the issuer.
    String PUBLIC_CERT_URL_PREFIX = "https://www.googleapis.com/service_accounts/v1/metadata/x509/";
    // Intended audience of the token, which will be the project number of the bot.
    String AUDIENCE = "[YOUR_PROJECT_NUMBER]";

    GooglePublicKeysManager.Builder keyManagerBuilder = new GooglePublicKeysManager.Builder(new NetHttpTransport(), JacksonFactory.getDefaultInstance());
    String certUrl = PUBLIC_CERT_URL_PREFIX + CHAT_ISSUER;
    keyManagerBuilder.setPublicCertsEncodedUrl(certUrl);

    GoogleIdTokenVerifier.Builder verifierBuilder =
            new GoogleIdTokenVerifier.Builder(keyManagerBuilder.build());
    verifierBuilder.setIssuer(CHAT_ISSUER);
    GoogleIdTokenVerifier verifier = verifierBuilder.build();

    String jwtToken=(((HttpServletRequest) req).getHeader("Authorization"));
    if(jwtToken==null || !jwtToken.contains(" ") || jwtToken.split(" ").length!=2){
      LOG.log(Level.SEVERE,"The token cannot be parsed because it is not valid or not present");
      return;
    }
    jwtToken=jwtToken.split(" ")[1];

    GoogleIdToken idToken = GoogleIdToken.parse(JacksonFactory.getDefaultInstance(), jwtToken);

    if (idToken == null) {
      LOG.log(Level.SEVERE,"The token cannot be parsed.");
      return;
    }

    // Verify valid token, signed by CHAT_ISSUER.
    try {
      if (!verifier.verify(idToken)
              || !idToken.verifyAudience(Collections.singletonList(AUDIENCE))
              || !idToken.verifyIssuer(CHAT_ISSUER)) {
        LOG.log(Level.SEVERE,"The token is invalid.");
        return;
      }
    } catch (GeneralSecurityException e) {
      LOG.log(Level.SEVERE,"An error occurred.",e);
      return;
    }

    // Token originates from Google and is targeted to a specific client.
    LOG.log(Level.INFO,"The token is valid. Caller is Google Hangouts Chat.");

    // Pass the request along the filter chain
    chain.doFilter(req, resp);
  }

  public void init(FilterConfig fConfig) throws ServletException {}
}
