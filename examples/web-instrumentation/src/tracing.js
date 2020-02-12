
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

const opentelemetry = require('@opentelemetry/api');
const { StackdriverTraceExporter } = require('@opentelemetry/exporter-stackdriver-trace');
const { LogLevel } = require('@opentelemetry/core');
const { NodeTracerProvider } = require('@opentelemetry/node');
const { BatchSpanProcessor } = require('@opentelemetry/tracing');

/**
 * Initialize tracing
 * @return {Tracer} tracer object
 */
module.exports.initTracing = () => {
  const provider = new NodeTracerProvider({
    logLevel: LogLevel.ERROR,
  });
  opentelemetry.trace.initGlobalTracerProvider(provider);
  const tracer = opentelemetry.trace.getTracer('default');
  provider.addSpanProcessor(new BatchSpanProcessor(getExporter()));
  console.log('initTracing: done');
  return tracer;
};

function getExporter() {
  const keyFileName = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyFileName) {
    console.log('Proceed without a keyFileName (will only work on GCP)');
    return new StackdriverTraceExporter({});
  }
  console.log('Using GOOGLE_APPLICATION_CREDENTIALS');
  return new StackdriverTraceExporter({ keyFileName });
}
