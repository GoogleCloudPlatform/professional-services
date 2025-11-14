# MCP Server

## Introduction

This MCP Server is a Spring Boot application that serves as a dynamic tool provider for AI models, enabling them to interact with backend APIs. It works by parsing an OpenAPI specification at startup and creating a corresponding "tool" for each API operation defined.

These tools can then be invoked by a Large Language Model (LLM) to perform actions, effectively allowing the LLM to use the API to fulfill tasks. The server handles the translation from the LLM's tool call into a live HTTP request to the target API, including authentication. A key feature is its ability to process and simplify complex JSON schemas (e.g., `oneOf`, `allOf`) from the OpenAPI specification, making them easier for the LLM to understand and use correctly.

## Architecture Diagram

![architecture_diagram.png](architecture_diagram.png?raw=true "MCP Server Architecture Diagram")

## How to Run

1.  **Prerequisites**:
    *   Java 17 or later
    *   Apache Maven

2.  **Configuration**:

    * Before starting the application, keep your OpenAPI Specs under [src/main/resources/openapi/](src/main/resources/openapi/) directory.
    * Ensure you're creating a ToolCallbackProvider Bean for your OAS. For example:

        ```java
        @Bean
	    ToolCallbackProvider flightSearch(OASSchemaHandler schemaProcessor, RestTemplate restTemplate) {
		    return new DynamicOpenApiToolCallbackProvider("/openapi/your-oas-spec.yaml", schemaProcessor, restTemplate, apiUrlEnv);
	    }
        ```

    * Make sure you have set the below environment variable:

        * `API_ENV_URL`: Your API Environment URL value.
    
3.  **Run the application**:

    Navigate to the project's root directory and execute the following Maven command:
    ```bash
    mvn spring-boot:run
    ```
    The server will start on the port `8081`.