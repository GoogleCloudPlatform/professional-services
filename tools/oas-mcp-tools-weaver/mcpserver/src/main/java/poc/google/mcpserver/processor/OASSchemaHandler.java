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
package poc.google.mcpserver.processor;

import java.util.List;

import io.swagger.v3.oas.models.media.Schema;
import poc.google.mcpserver.processor.keywords.IKeywordHandler;

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