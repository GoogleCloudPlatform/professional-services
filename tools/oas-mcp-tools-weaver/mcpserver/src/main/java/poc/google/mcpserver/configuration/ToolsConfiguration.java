/*
 * Copyright (C) 2025 Google Inc.
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
package poc.google.mcpserver.configuration;

import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import poc.google.mcpserver.processor.OASSchemaHandler;
import poc.google.mcpserver.tool.DynamicOpenApiToolCallbackProvider;

/**
 * Configuration class for creating Spring AI {@link ToolCallbackProvider} beans
 * from OpenAPI specifications. This allows for dynamic generation of tools
 * that can be used by an AI model.
 */
@Configuration
public class ToolsConfiguration {

	/**
	 * The environment for the API (e.g., 'petstore3.swagger.io').
	 */
	@Value("${api.envUrl}")
	private String apiUrlEnv;

	/**
	 * Creates a {@link ToolCallbackProvider} for the Pet Store API.
	 * The tools are dynamically generated from the {@code /openapi/petStore.yaml} specification.
	 *
	 * @param schemaProcessor The processor to handle complex OpenAPI schema constructs.
	 * @param restTemplate The RestTemplate to use for making API calls.
	 * @return A {@link ToolCallbackProvider} containing tools for the Pet Store API.
	 */
	@Bean
	ToolCallbackProvider petStoreTools(OASSchemaHandler schemaProcessor, RestTemplate restTemplate) {
		return new DynamicOpenApiToolCallbackProvider("/openapi/petStore.yaml", schemaProcessor, restTemplate, apiUrlEnv);
	}

}