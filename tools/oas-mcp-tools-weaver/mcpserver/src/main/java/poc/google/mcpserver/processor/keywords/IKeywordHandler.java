package poc.google.mcpserver.processor.keywords;

import io.swagger.v3.oas.models.media.Schema;

public interface IKeywordHandler {
    void process(Schema<?> schema);
}