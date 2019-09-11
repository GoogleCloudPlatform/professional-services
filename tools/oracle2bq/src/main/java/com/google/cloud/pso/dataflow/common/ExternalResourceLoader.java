/*
 * Copyright (C) 2018 Google Inc.
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

package com.google.cloud.pso.dataflow.common;

import com.google.common.base.Preconditions;
import com.google.common.flogger.FluentLogger;
import com.google.common.io.Resources;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import org.apache.beam.sdk.transforms.SerializableFunction;

/**
 * Helper class to load from an external resource.
 */
public class ExternalResourceLoader implements SerializableFunction<String, String> {

    private static final long serialVersionUID = 4757803927036039752L;

    private static final FluentLogger LOGGER = FluentLogger.forEnclosingClass();

    /**
     * Loads the data from the given {@link URL url}.
     *
     * @param resourceUrl The resource URL
     *
     * @return The content from the URL
     */
    private static String loadFromUrl(URL resourceUrl) throws IOException {
        final String resourceContent = Resources.toString(resourceUrl, StandardCharsets.UTF_8);
        return resourceContent;
    }

    /**
     * Loads from a resource in the classpath.
     *
     * @param resourceName The resource name
     *
     * @return The resource content
     *
     * @throws IOException if resource not found in the classpath
     */
    public static String loadFromClasspath(String resourceName) throws IOException {
        try {
            final URL resourceUrl = Resources.getResource(resourceName);
            return loadFromUrl(resourceUrl);
        } catch (IllegalArgumentException exception) {
            throw new IOException(exception);
        }
    }

    /**
     * Loads from the file system.
     *
     * @param resourceName The resource name
     *
     * @return The resource content
     *
     * @throws IllegalStateException if failed to load external resource
     */
    public static String loadFromExternalSource(String resourceName) {
        try {
            final File resourceFile = new File(resourceName);
            final URL resourceUrl = resourceFile.toURI().toURL();
            return loadFromUrl(resourceUrl);
        } catch (IOException exception) {
            throw new IllegalStateException(exception);
        }
    }

    /**
     * Loads the content from an external source.
     *
     * @param resourceName The name of the external source
     *
     * @return The resource content
     */
    @Override
    public String apply(String resourceName) {
        String resourceContent;
        try {
            resourceContent = loadFromClasspath(resourceName);
        } catch (IOException exception) {
            resourceContent = loadFromExternalSource(resourceName);
        }

        Preconditions.checkState(
                resourceContent != null && !resourceContent.isEmpty(),
                "Unable to load resource.");
        LOGGER.atInfo().log("Successfully loaded content from: %s", resourceName);
        return resourceContent;
    }
}
