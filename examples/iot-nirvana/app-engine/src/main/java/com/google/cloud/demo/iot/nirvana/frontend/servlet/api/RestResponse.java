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

package com.google.cloud.demo.iot.nirvana.frontend.servlet.api;

/** Class that represents a standard response of a servlet */
public class RestResponse {

  private int code;
  private String message;

  public RestResponse() {
    ;
  }

  /**
   * RestResponse message to be sent
   *
   * @param code the HTML code to be sent
   * @param message the message to be sent
   */
  public RestResponse(int code, String message) {
    this.code = code;
    this.message = message;
  }

  public void setCode(int code) {
    this.code = code;
  }

  public int getCode() {
    return this.code;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public String getMessage() {
    return this.message;
  }
}
