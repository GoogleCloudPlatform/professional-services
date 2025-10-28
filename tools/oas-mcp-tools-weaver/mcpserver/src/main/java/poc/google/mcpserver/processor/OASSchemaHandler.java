package poc.google.mcpserver.processor;

import io.swagger.v3.oas.models.media.Schema;
import poc.google.mcpserver.processor.keywords.IKeywordHandler;

import java.util.List;

/**
 * A handler that processes an OpenAPI {@link Schema} object by applying a series of
 * keyword-specific handlers. It recursively traverses the schema structure (objects and arrays)
 * to ensure all parts of the schema are processed.
 */
public class OASSchemaHandler {

    private final List<IKeywordHandler> keywordHandlers;

    /**
     * Constructs a new SchemaHandler with a list of keyword handlers.
     *
     * @param keywordHandlers The list of {@link IKeywordHandler} instances to apply to the schemas.
     */
    public OASSchemaHandler(List<IKeywordHandler> keywordHandlers) {
        this.keywordHandlers = keywordHandlers;
    }

    /**
     * Processes the given schema by applying all configured keyword handlers and then
     * recursively processing any nested schemas within its properties or items.
     *
     * @param schema The {@link Schema} object to process. Can be null.
     */
    public void process(Schema<?> schema) {
        if (schema == null) {
            return;
        }

        keywordHandlers.forEach(handler -> handler.process(schema));

        if ("object".equals(schema.getType()) && schema.getProperties() != null) {
            schema.getProperties().values().forEach(this::process);
        } else if ("array".equals(schema.getType()) && schema.getItems() != null) {
            process(schema.getItems());
        }
    }
}