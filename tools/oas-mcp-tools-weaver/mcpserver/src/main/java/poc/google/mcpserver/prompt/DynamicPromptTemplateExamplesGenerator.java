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
package poc.google.mcpserver.prompt;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;

import io.modelcontextprotocol.server.McpServerFeatures;
import io.modelcontextprotocol.server.McpServerFeatures.SyncPromptSpecification;
import io.modelcontextprotocol.spec.McpSchema;
import io.modelcontextprotocol.spec.McpSchema.GetPromptResult;
import io.modelcontextprotocol.spec.McpSchema.PromptMessage;
import io.modelcontextprotocol.spec.McpSchema.Role;
import io.modelcontextprotocol.spec.McpSchema.TextContent;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.examples.Example;
import io.swagger.v3.parser.OpenAPIV3Parser;
import io.swagger.v3.parser.core.models.ParseOptions;

/**
 * Dynamically generates MCP (Model Context Protocol) {@link SyncPromptSpecification} instances
 * from the examples found in an OpenAPI specification file.
 * <p>
 * This class reads an OpenAPI file, extracts the request body examples for each operation,
 * and creates a corresponding prompt specification that can serve these examples to an AI model.
 */
public class DynamicPromptTemplateExamplesGenerator {

    private static final Logger log = LoggerFactory.getLogger(DynamicPromptTemplateExamplesGenerator.class);

    private final ObjectMapper objectMapper = JsonMapper.builder().configure(MapperFeature.REQUIRE_HANDLERS_FOR_JAVA8_TIMES, false).build();
    private final List<SyncPromptSpecification> syncPromptSpecificationList = new ArrayList<>();
    
    /**
     * Generates a list of {@link McpServerFeatures.SyncPromptSpecification} from a given OpenAPI specification file.
     * It parses the spec, iterates through all operations, and constructs a prompt for each operation that has examples.
     *
     * @param openApiSpecPath The classpath resource path to the OpenAPI specification YAML file.
     * @return A list of {@link McpServerFeatures.SyncPromptSpecification} containing the extracted examples.
     * @throws RuntimeException if the OpenAPI spec file cannot be found, read, or parsed.
     */
    public List<McpServerFeatures.SyncPromptSpecification> generatPromptTemplatesFromOAS(String openApiSpecPath){

        objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        try (InputStream inputStream = this.getClass().getResourceAsStream(openApiSpecPath)) {
            if (inputStream == null) {
                throw new IllegalArgumentException("OpenAPI spec not found on classpath: " + openApiSpecPath);
            }

            String spec = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
            ParseOptions options = new ParseOptions();
            options.setResolve(true);
            options.setResolveFully(true);
            OpenAPI openAPI = new OpenAPIV3Parser().readContents(spec, null, options).getOpenAPI();

            if (openAPI == null) {
                throw new RuntimeException("Failed to read OpenAPI spec from: " + openApiSpecPath);
            } 
            
            openAPI.getPaths().forEach((path, pathItem) -> {
                pathItem.readOperationsMap().forEach((httpMethod, operation) -> constructPrompts(operation, openAPI));
            });

        } catch (Exception e) {
            throw new RuntimeException("Failed to load and parse OpenAPI spec", e);
        }

		return syncPromptSpecificationList;
    }

    /**
     * Extracts and serializes the request body examples for a given OpenAPI operation.
     * It handles resolving {@code $ref} pointers to examples defined in the components section.
     *
     * @param operation The OpenAPI {@link Operation} from which to extract examples.
     * @param openAPI The fully resolved {@link OpenAPI} model, used for resolving references.
     * @return A JSON string representation of the examples, or a fallback message if no examples are found or an error occurs.
     */
    private String extractExamplesFromReqBody(Operation operation, OpenAPI openAPI) {

        if (operation.getRequestBody().getContent().get("application/json").getExamples() == null) {
            return "Refer tool description and inputSchema to build JSON Request Body";
        }

        Map<String, Example> examplesMap = operation.getRequestBody().getContent().get("application/json").getExamples();

        try {
            // Manually resolve $ref in examples
            for (Map.Entry<String, Example> entry : examplesMap.entrySet()) {
                Example example = entry.getValue();
                if (example.get$ref() != null) {
                    String ref = example.get$ref();
                    if (ref.startsWith("#/components/examples/")) {
                        String exampleName = ref.substring("#/components/examples/".length());
                        if (openAPI.getComponents() != null && openAPI.getComponents().getExamples() != null) {
                            Example resolvedExample = openAPI.getComponents().getExamples().get(exampleName);
                            if (resolvedExample != null) {
                                entry.setValue(resolvedExample);
                            }
                        }
                    }
                }
            }
            String examples = objectMapper.writeValueAsString(examplesMap);
            log.debug("Extracted examples for operation {}: {}", operation.getOperationId(), examples);
            return examples;
        } catch (JsonProcessingException e) {
            log.warn("JsonProcessingException while extracting examples for operation {}", operation.getOperationId(), e);
            return "Refer tool description and inputSchema to build JSON Request Body";
        }
    }

    /**
     * Constructs a {@link McpServerFeatures.SyncPromptSpecification} for a given operation.
     * The prompt contains the extracted request body examples.
     *
     * @param operation The OpenAPI {@link Operation} to construct the prompt for.
     * @param openAPI The fully resolved {@link OpenAPI} model.
     */
    private void constructPrompts(Operation operation, OpenAPI openAPI) {

        String operationId = operation.getOperationId();
        if (operationId == null || operationId.isBlank()) return;

        String examples = extractExamplesFromReqBody(operation, openAPI);
        
        var prompt = new McpSchema.Prompt(operation.getOperationId() + "_examples", "Examples of Request Body for " + operation.getOperationId() + " tool", null);

        syncPromptSpecificationList.add(new McpServerFeatures.SyncPromptSpecification(prompt, (exchange, getPromptRequest) -> {
            var userMessage = new PromptMessage(Role.USER, new TextContent(
                examples
            ));
            return new GetPromptResult("Tool Request Body Examples", List.of(userMessage));
        }));    
    }
}
