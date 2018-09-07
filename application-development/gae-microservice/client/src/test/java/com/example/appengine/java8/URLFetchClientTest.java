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
 * Unit test for class URLFetchClient
 */
package com.example.appengine.java8;

import static org.mockito.Mockito.when;

import com.google.appengine.tools.development.testing.LocalServiceTestHelper;

import java.io.PrintWriter;
import java.io.StringWriter;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

/**
 * Unit tests for {@link HelloAppEngine}.
 */
@RunWith(JUnit4.class)
public class URLFetchClientTest {

  private static final String FAKE_URL = "fake.fk/hello?data=small";

  // Set up a helper so that the ApiProxy returns a valid environment for local testing.
  private final LocalServiceTestHelper helper = new LocalServiceTestHelper();

  @Mock private ServletConfig servletConfig;
  @Mock private ServletContext servletContext;
  @Mock private HttpServletRequest mockRequest;
  @Mock private HttpServletResponse mockResponse;
  private URLFetchClient servletUnderTest;
  private StringWriter responseWriter;

  @Before
  public void setUp() throws Exception {
    MockitoAnnotations.initMocks(this);
    helper.setUp();

    //  Set up mock objects
    when(mockRequest.getRequestURI()).thenReturn(FAKE_URL);
    when(servletConfig.getServletContext()).thenReturn(servletContext);
    when(servletContext.getRealPath("/static/zeros700k.dat")).thenReturn("src/main/webapp/static/zeros700k.dat");
    responseWriter = new StringWriter();
    when(mockResponse.getWriter()).thenReturn(new PrintWriter(responseWriter));

    servletUnderTest = new URLFetchClient();
    servletUnderTest.init(servletConfig);
  }

  @After public void tearDown() {
    helper.tearDown();
  }

  @Test
  public void doGetWritesResponse() throws Exception {
    servletUnderTest.doGet(mockRequest, mockResponse);
  }

}
// [END example]
