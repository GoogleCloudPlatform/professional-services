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

import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for creating MCP (Model Context Protocol) prompt specifications
 * dynamically from OpenAPI specification files.
 */
@Configuration
public class PromptsConfiguration {

	/**
	 * Creates a list of {@link McpServerFeatures.SyncPromptSpecification} beans for the Pet Store API.
	 * These prompts are generated from the examples in the petStore.yaml OpenAPI specification.
	 *
	 * @return A list of synchronous prompt specifications for the pet store.
	 */
	// @Bean
	// public List<McpServerFeatures.SyncPromptSpecification> petStorePrompts() {
    //     return new DynamicPromptTemplateExamplesGenerator().generatPromptTemplatesFromOAS("/openapi/petStore.yaml");
	// }

}