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
package poc.google.mcpserver.tool;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.BiFunction;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.definition.ToolDefinition;
import org.springframework.ai.tool.function.FunctionToolCallback;
import org.springframework.core.ResolvableType;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.examples.Example;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.parameters.Parameter;
import io.swagger.v3.parser.OpenAPIV3Parser;
import io.swagger.v3.parser.core.models.ParseOptions;
import poc.google.mcpserver.processor.OASSchemaHandler;

/**
 * A {@link ToolCallbackProvider} that dynamically creates {@link ToolCallback} instances
 * from an OpenAPI specification file.
 * <p>
 * This class parses an OpenAPI specification, and for each operation defined, it constructs
 * a corresponding {@link FunctionToolCallback}. This tool can then be invoked by an AI model.
 * The tool's function is to make an HTTP request to the API endpoint described by the operation.
 * It handles schema processing, example extraction, and the actual REST call.
 */
public class DynamicOpenApiToolCallbackProvider implements ToolCallbackProvider {

    private static final Logger logger = LoggerFactory.getLogger(DynamicOpenApiToolCallbackProvider.class);

    private final OASSchemaHandler schemaProcessor;

    private final RestTemplate restTemplate;
    private final Map<String, BiFunction<Object, ToolContext, Object>> toolMap = new LinkedHashMap<>();
    private final Map<String, String> opIdToInputSchemaMap = new HashMap<>();
    private final Map<String, String> opIdToDescriptionMap = new HashMap<>();
    private final Map<String, List<Parameter>> opIdToParamMap = new HashMap<>();

    private final ObjectMapper objectMapper = JsonMapper.builder().configure(MapperFeature.REQUIRE_HANDLERS_FOR_JAVA8_TIMES, false).build();

    private final String defaultInputSchema = """
            {
              "type": "object",
              "properties": {}
            }
            """;
    
    /**
     * Constructs a new DynamicOpenApiToolCallbackProvider.
     * It reads and parses the OpenAPI specification from the given path, then constructs
     * a tool for each operation found.
     *
     * @param openApiSpecPath The classpath resource path to the OpenAPI specification file.
     * @param schemaProcessor A handler to process and simplify OpenAPI schemas.
     * @param restTemplate    The {@link RestTemplate} to use for making the API calls.
     * @param apiUrlEnv       The environment string (e.g., 'api.cert.platform') to substitute in the server URL.
     */
    public DynamicOpenApiToolCallbackProvider(
            String openApiSpecPath,
            OASSchemaHandler schemaProcessor,
            RestTemplate restTemplate,
            String apiUrlEnv
        ) {
        
        this.schemaProcessor = schemaProcessor;
        this.restTemplate = restTemplate;

        // objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
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


            String apiUrl = openAPI.getServers().get(0).getUrl()
                                    .replace("{environment}", apiUrlEnv);

            openAPI.getPaths().forEach(
                (path, pathItem) -> {
                    pathItem.readOperationsMap().forEach(
                        (httpMethod, operation) -> constructToolMap(apiUrl, path, httpMethod, operation, openAPI));
                }
            );

        } catch (Exception e) {
            logger.error("Failed to load and parse OpenAPI spec from: {}", openApiSpecPath, e);
            throw new RuntimeException("Failed to load and parse OpenAPI spec", e);
        }
    }

    /**
     * Constructs a single tool (a function) based on an OpenAPI {@link Operation}.
     * This method extracts the necessary information like operationId, input schema, and description,
     * and creates a function that, when called, executes an HTTP request against the API.
     *
     * @param apiUrl     The base URL of the API server.
     * @param path       The specific path for the operation (e.g., "/v1/offers/flightShop").
     * @param httpMethod The HTTP method for the operation (e.g., POST).
     * @param operation  The OpenAPI {@link Operation} object.
     * @param openAPI    The fully parsed {@link OpenAPI} object for resolving references.
     */
    private void constructToolMap(String apiUrl, String path, PathItem.HttpMethod httpMethod, Operation operation, OpenAPI openAPI) {
        String operationId = operation.getOperationId();
        if (operationId == null || operationId.isBlank()) return;

        String inputSchema = buildInputSchema(operation);
        opIdToInputSchemaMap.put(operationId, inputSchema);

        String opDesc = operation.getDescription();
        String examples = extractExamplesForOp(operation, openAPI);
        opDesc = opDesc + "\n" + "Below are some examples on how to structure the request body for the tool based on different use cases:\n" + examples;
        opIdToDescriptionMap.put(operationId, opDesc);

        toolMap.put(operationId, (input, context) -> {
            try{
                System.out.println("Tool operationId => " + operationId);

                String resolvedPath = path;
                String fullUrl = apiUrl + resolvedPath;

                List<Parameter> paramList = opIdToParamMap.get(operationId);
                
                Map<String, Object> restCallDataMap = constructUrlParamsAndRequestBodyFromInput(operationId, input, fullUrl, paramList);

                String requestBody="";
                try {
                    requestBody = objectMapper.writeValueAsString(restCallDataMap.get("requestBody"));
                } catch (JsonProcessingException e) {
                    logger.error("Failed to convert to JSON request for operationId: {}", operationId, e);
                }
                String finalUrl = (String) restCallDataMap.get("finalUrl");

                logger.debug("Executing tool '{}' with finalUrl: {} and requestBody: {}", operationId, finalUrl, requestBody);

                HttpHeaders headers = new HttpHeaders();
                // headers.setBearerAuth(authToken);
                HttpEntity<Object> entity = null;

                if(httpMethod.name().equals("GET")) {
                    entity = new HttpEntity<>(headers);
                } else {
                    entity = new HttpEntity<>(requestBody, headers);
                }

                ResponseEntity<String> response = restTemplate.exchange(
                        finalUrl,
                        HttpMethod.valueOf(httpMethod.name()),
                        entity,
                        String.class
                );

                try {
                    logger.debug("Response for operationId '{}': {}", operationId, response.getBody());
                    return response.getBody();
                } catch (Exception e) {
                    logger.error("Failed to parse JSON response for operationId: {}", operationId, e);
                    throw new RuntimeException("Failed to parse JSON response for " + operationId, e);
                }
            } catch (Exception e) {
                logger.error("operationId: {} failed with error: {}", operationId, e);
                throw new RuntimeException("Failed to execute tool for op id => " + operationId, e);
            }
        });
    }

    // private Map<String, String> constructUrlParamsAndRequestBodyFromInput(String operationId, Object input, String fullUrl, List<Parameter> paramList) {
        
    //     Map<String, String> inputMap = new HashMap<>();
        
    //     try {
    //         inputMap = objectMapper.convertValue(input, new TypeReference<Map<String, String>>() {});
    //         logger.debug("inputMap: {}", inputMap);
    //         for(Map.Entry entry : inputMap.entrySet()) {
    //             System.out.println(entry.getKey() + " => " + entry.getKey().getClass());
    //             System.out.println(entry.getValue() + " => " + entry.getValue().getClass());
    //         }
    //         logger.debug("Input requestBody for operationId '{}': {}", operationId, inputMap.get("requestBody"));
    //     } catch (IllegalArgumentException e) {
    //         logger.error("Error serializing request body for operationId: {}", operationId, e);
    //     }

    //     if(paramList != null) {
    //         List<String> queryParamStrList = new ArrayList<>();
    //         for(Parameter param : paramList) {
    //             if(inputMap.containsKey(param.getName())) {
    //                 if("path".equals(param.getIn())) {
    //                     fullUrl.replace("{" + param.getName() + "}", inputMap.get(param.getName()));
    //                 } else if ("query".equals(param.getIn())) {
    //                     if(param.getSchema().getType().equals("array")) {
    //                         //TODO: ARRAY IMPLEMENTATION
    //                         // ArrayList<String> test = inputMap.get(param.getName());
    //                         // if(test instanceof ArrayList){

    //                         // }
    //                         System.out.println("query array => " + inputMap.get(param.getName()));
    //                     } else {
    //                         queryParamStrList.add(param.getName() + "=" + inputMap.get(param.getName()));
    //                         // querySb.append(param.getName() + "=" + inputMap.get(param.getName()));
    //                         // fullUrl += ("?" + param.getName() + "=" + inputMap.get(param.getName()));
    //                     }
    //                 }
    //             }
    //             if(queryParamStrList.size() > 0) {
    //                 fullUrl += "?" + String.join("&", queryParamStrList);
    //             }
    //         }
    //         inputMap.put("finalUrl", fullUrl);
    //     } else {
    //         inputMap.put("finalUrl", fullUrl);
    //     }

    //     return inputMap;
    // }

    private Map<String, Object> constructUrlParamsAndRequestBodyFromInput(String operationId, Object input, String fullUrl, List<Parameter> paramList) {

        Map<String, Object> inputMap = (HashMap<String, Object>) input;
        
        // Map<String, String> inputMap = new HashMap<>();
        
        // try {
        //     inputMap = objectMapper.convertValue(input, new TypeReference<Map<String, String>>() {});
        //     logger.debug("inputMap: {}", inputMap);
        //     for(Map.Entry entry : inputMap.entrySet()) {
        //         System.out.println(entry.getKey() + " => " + entry.getKey().getClass());
        //         System.out.println(entry.getValue() + " => " + entry.getValue().getClass());
        //     }
        //     logger.debug("Input requestBody for operationId '{}': {}", operationId, inputMap.get("requestBody"));
        // } catch (IllegalArgumentException e) {
        //     logger.error("Error serializing request body for operationId: {}", operationId, e);
        // }

        if(paramList != null) {
            List<String> queryParamStrList = new ArrayList<>();
            for(Parameter param : paramList) {
                if(inputMap.containsKey(param.getName())) {
                    if("path".equals(param.getIn())) {
                        fullUrl = fullUrl.replace("{" + param.getName() + "}", String.valueOf(inputMap.get(param.getName())));
                    } else if ("query".equals(param.getIn())) {
                        if(param.getSchema().getType().equals("array")) {
                            //TODO: ARRAY IMPLEMENTATION
                            System.out.println("query array => " + inputMap.get(param.getName()));
                            if(inputMap.get(param.getName()) instanceof List) {
                                List<String> tempStrList = (List<String>) inputMap.get(param.getName());
                                tempStrList.forEach((element) -> queryParamStrList.add(param.getName() + "=" + element));
                            }
                        } else {
                            queryParamStrList.add(param.getName() + "=" + inputMap.get(param.getName()));
                            // querySb.append(param.getName() + "=" + inputMap.get(param.getName()));
                            // fullUrl += ("?" + param.getName() + "=" + inputMap.get(param.getName()));
                        }
                    }
                }
                if(queryParamStrList.size() > 0) {
                    fullUrl += "?" + String.join("&", queryParamStrList);
                }
            }
            inputMap.put("finalUrl", fullUrl);
        } else {
            inputMap.put("finalUrl", fullUrl);
        }

        return inputMap;
    }


    /**
     * {@inheritDoc}
     */
    @Override
    public ToolCallback[] getToolCallbacks() {
        return toolMap.entrySet().stream()
                .map(entry -> {
                    String operationId = entry.getKey();
                    String schema = opIdToInputSchemaMap.getOrDefault(operationId, defaultInputSchema);
                    String description = opIdToDescriptionMap.getOrDefault(operationId, "Tool generated from OpenAPI spec");

                    logger.debug("Schema for tool '{}': {}", operationId, schema);

                    ToolDefinition definition = ToolDefinition.builder()
                            .name(operationId)
                            .description(description)
                            .inputSchema(schema)
                            .build();

                    return new FunctionToolCallback(
                            definition,
                            null,
                            ResolvableType.forClass(Object.class).getType(),
                            entry.getValue(),
                            null
                    );
                })
                .toArray(ToolCallback[]::new);
    }

    /**
     * Builds a JSON schema string for the input of a tool from the operation's parameters and request body.
     * It uses the {@link OASSchemaHandler} to process and simplify the schema before serialization.
     *
     * @param operation The OpenAPI {@link Operation}.
     * @return A JSON string representing the input schema, or a default empty object schema on failure.
     */
    private String buildInputSchema(Operation operation) {

        Schema<?> rootSchema;
        rootSchema = new Schema<>();
        rootSchema.setType("object");
        rootSchema.setProperties(new HashMap<>());
        List<String> reqList = new ArrayList<>();

        if(operation.getParameters() != null) {
            operation.getParameters().forEach(parameter -> {
                if (parameter.getRequired())
                    reqList.add(parameter.getName());
                rootSchema.getProperties().put(parameter.getName(), parameter.getSchema());
            });
            opIdToParamMap.put(operation.getOperationId(), operation.getParameters());
        }

        if(operation.getRequestBody() != null &&
            operation.getRequestBody().getContent()!= null &&
            operation.getRequestBody().getContent().get("application/json") != null &&
            operation.getRequestBody().getContent().get("application/json").getSchema() != null) {
                Schema<?> requestBodySchema = operation.getRequestBody().getContent().get("application/json").getSchema();
                schemaProcessor.process(requestBodySchema);
                reqList.add("requestBody");
                rootSchema.getProperties().put("requestBody", requestBodySchema);
        }

        rootSchema.setRequired(reqList);

        try {
            return objectMapper.writeValueAsString(rootSchema);
        } catch (JsonProcessingException e) {
            logger.error("Error processing schema for operation: {}", operation.getOperationId(), e);
            return defaultInputSchema;
        }
    }

    /**
     * Extracts and serializes the request body examples for a given OpenAPI operation.
     * This method manually resolves {@code $ref} pointers to examples defined in the components section.
     * The serialized examples are appended to the tool's description to provide context to the AI model.
     *
     * @param operation The OpenAPI {@link Operation} from which to extract examples.
     * @param openAPI   The fully parsed {@link OpenAPI} model for resolving references.
     * @return A JSON string of the examples, or a fallback message if none are found or an error occurs.
     */
    private String extractExamplesForOp(Operation operation, OpenAPI openAPI) {

        if (operation.getRequestBody() == null ||
            operation.getRequestBody().getContent() == null ||
            operation.getRequestBody().getContent().get("application/json") == null ||
            operation.getRequestBody().getContent().get("application/json").getExamples() == null) {
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
            logger.debug("Extracted examples for operation '{}': {}", operation.getOperationId(), examples);
            return examples;
        } catch (JsonProcessingException e) {
            logger.warn("Could not process and extract examples for operation: {}", operation.getOperationId(), e);
            return "Refer tool description and inputSchema to build JSON Request Body";
        }
    }
}