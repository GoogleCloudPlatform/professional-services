package com.google.cloud.tools.sce.aurinko.validator.exception;
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


public class SchemaMessageMismatchException extends Exception {
    private static final long serialVersionUID = 2457639491613040L;
    private String schemaName;
    private String schemaFile;

	public SchemaMessageMismatchException(String schemaName, String schemaFile) {
        super(new String("Message mismatch with schema " + schemaName + " from file " + schemaFile));
        this.schemaName = schemaName;
        this.schemaFile = schemaFile;
        
    }

    public String getSchemaName() {
        return this.schemaName;
    }

    public String getSchemaFile() {
        return this.schemaFile;
    }
}