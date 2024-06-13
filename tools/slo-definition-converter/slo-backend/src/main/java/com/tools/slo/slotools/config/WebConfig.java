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
package com.tools.slo.slotools.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration class responsible for handling Cross-Origin Resource Sharing (CORS) settings in the
 * Spring Boot application.
 *
 * <p>CORS is a security mechanism that allows a web page from one domain (origin) to access
 * resources from a different domain. This configuration enables flexible CORS settings to support
 * interactions between different origins.
 */
@Configuration
public class WebConfig {

  /**
   * Creates and configures a {@link WebMvcConfigurer} bean to manage CORS mappings.
   *
   * @return A configured {@code WebMvcConfigurer} instance that defines CORS rules.
   */
  @Bean
  public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
      @Override
      public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**").allowedOrigins("*").allowedMethods("*").allowedHeaders("*");
      }
    };
  }
}
