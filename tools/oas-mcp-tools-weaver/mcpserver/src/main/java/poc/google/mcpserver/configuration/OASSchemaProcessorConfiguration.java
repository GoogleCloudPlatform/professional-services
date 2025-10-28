package poc.google.mcpserver.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import poc.google.mcpserver.processor.OASSchemaHandler;
import poc.google.mcpserver.processor.keywords.AllOfHandler;
import poc.google.mcpserver.processor.keywords.AnyOfHandler;
import poc.google.mcpserver.processor.keywords.IKeywordHandler;
import poc.google.mcpserver.processor.keywords.OneOfHandler;

import java.util.List;

/**
 * Configuration class for setting up the OpenAPI Schema processor and its keyword handlers.
 * This is used to simplify complex schema structures (like oneOf, allOf) into a format
 * that is more easily understood by AI models.
 */
@Configuration
public class OASSchemaProcessorConfiguration {

    /**
     * Provides a handler for the {@code oneOf} keyword in an OpenAPI schema.
     *
     * @return An {@link IKeywordHandler} for the {@code oneOf} keyword.
     */
    @Bean
    public IKeywordHandler oneOfHandler() {
        return new OneOfHandler();
    }

    /**
     * Provides a handler for the {@code anyOf} keyword in an OpenAPI schema.
     *
     * @return An {@link IKeywordHandler} for the {@code anyOf} keyword.
     */
    @Bean
    public IKeywordHandler anyOfHandler() {
        return new AnyOfHandler();
    }

    /**
     * Provides a handler for the {@code allOf} keyword in an OpenAPI schema.
     *
     * @return An {@link IKeywordHandler} for the {@code allOf} keyword.
     */
    @Bean
    public IKeywordHandler allOfHandler() {
        return new AllOfHandler();
    }

    /**
     * Creates the main {@link OASSchemaHandler} bean.
     * This handler iterates through a list of keyword-specific handlers to process
     * and simplify an OpenAPI schema.
     *
     * @param keywordHandlers A list of all configured {@link IKeywordHandler} beans.
     * @return The main {@link OASSchemaHandler} for processing schemas.
     */
    @Bean
    public OASSchemaHandler schemaProcessor(List<IKeywordHandler> keywordHandlers) {
        return new OASSchemaHandler(keywordHandlers);
    }
}