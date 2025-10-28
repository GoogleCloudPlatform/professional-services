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
package poc.google.mcpserver.processor.keywords;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import io.swagger.v3.oas.models.media.Schema;

/**
 * A handler for the {@code oneOf} keyword in an OpenAPI schema.
 * This handler merges the properties of all sub-schemas listed in the {@code oneOf}
 * array into a single superset of properties in the parent schema. This flattens
 * the structure, making it simpler for consumers that may not fully support composition keywords.
 */
public class OneOfHandler implements IKeywordHandler {

    /**
     * Processes a schema to resolve the {@code oneOf} keyword.
     * @param schema The schema to process.
     */
    @Override
    public void process(Schema<?> schema) {
        List<Schema> subSchemaList = schema.getOneOf();
        if(subSchemaList != null && subSchemaList.size() > 0) {
            Map<String, Schema> supersetProperties = new HashMap<>();
            
            subSchemaList.stream()
                .filter(subSchema -> subSchema.getProperties() != null)
                .map(Schema::getProperties)
                .forEach(supersetProperties::putAll);

            schema.setProperties(supersetProperties);
            schema.setOneOf(null);
        }
    }

}