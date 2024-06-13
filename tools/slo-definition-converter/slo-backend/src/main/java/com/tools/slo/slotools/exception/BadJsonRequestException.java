/**
 * Copyright 2024 Google LLC
 *
 * <p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License at
 *
 * <p>https://www.apache.org/licenses/LICENSE-2.0
 *
 * <p>Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.tools.slo.slotools.exception;

/**
 * Custom exception class indicating a bad JSON request.
 *
 * <p>Thrown when an incoming JSON request is invalid due to parsing errors, structural issues, or
 * missing required fields.
 */
public class BadJsonRequestException extends Exception {

  /**
   * Constructs a new BadJsonRequestException with the specified error message.
   *
   * @param exceptionMessage A descriptive message explaining why the JSON request is considered
   *     bad.
   */
  public BadJsonRequestException(String exceptionMessage) {
    super("Bad Json request due to " + exceptionMessage);
  }
}
