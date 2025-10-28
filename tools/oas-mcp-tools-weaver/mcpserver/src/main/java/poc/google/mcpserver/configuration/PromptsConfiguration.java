package poc.google.mcpserver.configuration;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.modelcontextprotocol.server.McpServerFeatures;
import poc.google.mcpserver.prompt.DynamicPromptTemplateExamplesGenerator;

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