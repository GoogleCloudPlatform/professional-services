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

public interface ApiInterface {
    static final String GAE_QUEUE_NAME_GCE = "gce";
    static final int TASK_ENQUEUE_DELAY = 0;
    static final String HTML_CODE_500_INTERNAL_SERVER_ERROR =
            "An internal error occurred, please check the server logs";
    static final String HTML_CODE_400_BAD_REQUEST =
            "The request received from the server was not correct";
    static final String HTML_CODE_200_OK_MESSAGE = "OK";
}
