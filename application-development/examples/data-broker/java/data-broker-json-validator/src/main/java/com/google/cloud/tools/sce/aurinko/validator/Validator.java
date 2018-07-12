/*
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.google.cloud.tools.sce.aurinko.validator;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.file.DirectoryStream;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Map.Entry;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;

import com.fasterxml.jackson.databind.JsonNode;
import com.github.fge.jackson.JsonLoader;
import com.github.fge.jsonschema.core.exceptions.ProcessingException;
import com.github.fge.jsonschema.core.report.ProcessingReport;
import com.github.fge.jsonschema.main.JsonSchema;
import com.github.fge.jsonschema.main.JsonSchemaFactory;
import com.google.cloud.tools.sce.aurinko.validator.exception.MissingSchemaException;
import com.google.cloud.tools.sce.aurinko.validator.exception.SchemaMessageMismatchException;


public class Validator {
    
    private HashMap<String, ValidatorJsonSchema> schemaMap;
   
    /**
     * Constructor.  Json schema files are loaded dynamically.  Please
     * see the 'data-broker-json-schema' project for more information.
     */
    public Validator() throws IOException, ProcessingException {
        this.schemaMap = new HashMap<String, ValidatorJsonSchema>();
        String resourcePath = "";
        try {
            // If the Validator is instantiated from a projet directory,
            // e.g. for unit testing, then the schemas can be accessed directly 
            // from the file system.  
            resourcePath = getClass().getResource("/").getFile();
            this.addSchemas(resourcePath);
        } catch (NullPointerException e) {
            // However, if the Validator is included in a Jar file the schemas must be 
            // read in as a stream.  
            String path = Validator.class.getResource(Validator.class.getSimpleName() + ".class").getFile();
            if(path.startsWith("/")) {
                throw new FileNotFoundException("This is not a jar file: \n" + path);
            }
            path = path.substring(0, path.lastIndexOf('!')).replace("file:", "");
            this.addSchemaFromJar(path);

        }
    }

    private void addSchemaFromJar(String resourcePath) throws IOException, ProcessingException {
        JarFile jf = new JarFile(resourcePath);
        Enumeration<JarEntry> entries = jf.entries();
        InputStream stream;
        ValidatorJsonSchema tempSchema;
        while (entries.hasMoreElements()) {
            JarEntry fileEntry = entries.nextElement();
            String fileEntryPath = fileEntry.getName();
            String fileEntryFileName = "";
            try {
                fileEntryFileName = fileEntry.getName()
                                             .substring(fileEntryPath.lastIndexOf(File.separator), 
                                                        fileEntryPath.length());
            
            } catch (java.lang.StringIndexOutOfBoundsException e) {
                fileEntryFileName = fileEntryPath;
            }
            if ((fileEntryFileName.contains("schema")) && 
                (fileEntryFileName.endsWith(".json"))) {
                System.out.println(fileEntry.getName());
                stream = getClass().getClassLoader().getResourceAsStream(fileEntry.getName());
                JsonNode jsonSchema = JsonLoader.fromReader(new BufferedReader(new InputStreamReader(stream, "UTF-8")));
                JsonSchemaFactory factory = JsonSchemaFactory.byDefault();
                JsonSchema schema = factory.getJsonSchema(jsonSchema);
                String schemaTitle = jsonSchema.get("title").toString();
                tempSchema = new ValidatorJsonSchema(schema, fileEntryFileName);
                this.schemaMap.put(schemaTitle.replace("\"", ""), tempSchema);
            }
        }
        jf.close();
    }

    private void addSchemas(String resourcePath) throws IOException, ProcessingException {
        Path dir = FileSystems.getDefault().getPath(resourcePath);
        DirectoryStream<Path> stream = Files.newDirectoryStream(dir, "*.{json}");
        ValidatorJsonSchema tempSchema;
        for (Path path : stream) {
            if (path.getFileName().toString().toLowerCase().contains("schema")) {
                JsonNode jsonSchema = JsonLoader.fromFile(new File(path.toString()));
                JsonSchemaFactory factory = JsonSchemaFactory.byDefault();
                JsonSchema schema = factory.getJsonSchema(jsonSchema);
                String schemaTitle = jsonSchema.get("title").toString();
                tempSchema = new ValidatorJsonSchema(schema, path.toString());
                this.schemaMap.put(schemaTitle.replace("\"", ""), tempSchema);
            }
        }

    }

    public void validate(String jsonString) throws IOException, 
                                                   ProcessingException, 
                                                   MissingSchemaException, 
                                                   SchemaMessageMismatchException {
        this.validate(jsonString, true);
    }

    public void validate(String jsonString, boolean requireSchema) throws IOException, 
                                                                          ProcessingException, 
                                                                          MissingSchemaException, 
                                                                          SchemaMessageMismatchException {
        JsonNode jsonNode = JsonLoader.fromString(jsonString);
        this.validate(jsonNode, requireSchema);
    }

    public void validate(JsonNode jsonNode) throws IOException, 
                                                   ProcessingException, 
                                                   MissingSchemaException, 
                                                   SchemaMessageMismatchException {
        this.validate(jsonNode, true);
        
    }

    /**
     * Validate the message against the schema. The schema name
     * is matched against the first node name in the message.
     * If this doesn't throw an exception, the Json is valid.
     * 
     * @throws SchemaMessageMismatchException If a schema is found, required or not, 
     *                                        and the message doesn't match the schema.
     * @throws MissingSchemaException         If a schema is required and not found
     */
    public void validate(JsonNode jsonNode, boolean requireSchema) throws IOException, 
                                                                          ProcessingException, 
                                                                          MissingSchemaException, 
                                                                          SchemaMessageMismatchException {
        ProcessingReport report;
        Iterator<Entry<String, JsonNode>> nodes = jsonNode.fields();
        boolean valid = false;
        Map.Entry<String, JsonNode> entry = (Map.Entry<String, JsonNode>) nodes.next();
        String payloadName = entry.getKey();
        JsonNode nodeToValidate = entry.getValue();
        JsonSchema schema = null;
        try {
            schema = this.schemaMap.get(payloadName).getSchema();
        } catch (NullPointerException e) {
            // If the schema doesn't exist and schema checking is required,
            // throw a MissingSchemaException.
            if (requireSchema == true) {
                throw new MissingSchemaException(payloadName);
            }
        }
        
        // If the schema doesn't exist and we aren't
        // enforcing the check, then we will get a null
        // pointer.  Thus we ignore.
        //
        // If the schema exists and the incomming Json
        // doesn't match, throw a 
        // SchemaMessageMismatchException
        try {
            report = schema.validate(nodeToValidate);
            valid = report.isSuccess();
            if (!valid) {
                throw new SchemaMessageMismatchException(payloadName, this.schemaMap.get(payloadName).getFileName());
            }

        } catch (NullPointerException e) {

        }
    }
}