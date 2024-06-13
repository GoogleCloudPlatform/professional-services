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
package com.tools.slo.slotools;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * The main entry point for the Slotools application.
 *
 * <p>This class is annotated with {@code @SpringBootApplication} which indicates a configuration
 * class that declares one or more {@code @Bean} methods and also triggers auto-configuration and
 * component scanning.
 *
 * <p>The {@code main} method uses {@link SpringApplication#run(Class, String...)} to launch the
 * application.
 *
 * <pre>{@code
 * @SpringBootApplication
 * public class SlotoolsApplication {
 *
 *     public static void main(String[] args) {
 *         SpringApplication.run(SlotoolsApplication.class, args);
 *     }
 * }
 * }</pre>
 *
 * @see SpringApplication
 * @see SpringBootApplication
 */
@SpringBootApplication
public class SlotoolsApplication {

  /**
   * The main method which serves as the entry point for the Spring Boot application.
   *
   * @param args Command-line arguments passed to the application.
   */
  public static void main(String[] args) {
    SpringApplication.run(SlotoolsApplication.class, args);
  }
}
