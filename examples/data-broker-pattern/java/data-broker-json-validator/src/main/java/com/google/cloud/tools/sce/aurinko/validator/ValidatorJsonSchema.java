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

import com.github.fge.jsonschema.main.JsonSchema;

public class ValidatorJsonSchema {

    private JsonSchema schema;
    private String fileName;

    public ValidatorJsonSchema(JsonSchema schema, String fileName) {
        this.schema = schema;
        this.fileName = fileName;
    }

    public JsonSchema getSchema() {
        return this.schema;
    }

    public String getFileName() {
        return this.fileName;
    }
}