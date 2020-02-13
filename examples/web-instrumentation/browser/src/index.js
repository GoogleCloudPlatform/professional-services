
// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Entry point for the browser code for the test app. Initialize the app with
 * tracing configured.
 */

import { CollectorExporter } from '@opentelemetry/exporter-collector';
import { SimpleSpanProcessor } from '@opentelemetry/tracing';
import { DocumentLoad } from '@opentelemetry/plugin-document-load';
import { WebTracerProvider } from '@opentelemetry/web';
import { TestApp } from './TestApp';

/* global __VERSION__ */
console.log(`App version: ${__VERSION__}`);

// Edit this to point to your OpenCensus agent address:
// If running locally use http://localhost:55678/v1/trace
const collectorURL = 'http://localhost:55678/v1/trace';
// const collectorURL = 'http://35.192.92.171/v1/trace';

const webTracer = new WebTracerProvider({
  plugins: [
    new DocumentLoad(),
  ],
});
const collectorOptions = {
  url: collectorURL,
};
const exporter = new CollectorExporter(collectorOptions);
webTracer.addSpanProcessor(new SimpleSpanProcessor(exporter));

const testApp = new TestApp(collectorURL, __VERSION__);
testApp.setup();
