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

/**
 * This exception must be thrown by the clientCall method when the external service returns
 * an error because it throttled the request.
 */
public class ThrottlingException extends Exception {

    private String message;
    /**
     * Constructor for ThrottlingException.
     *
     * @param message passed from ThrottlingOrchestration.clientCall function.
     */
    public ThrottlingException(String message) {
        this.message = message;
    }
    /**
     * This method returns the error message.
     *
     * @return error message.
     */
    @Override
    public String getMessage() {
        return message;
    }
}
