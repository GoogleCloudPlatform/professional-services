'use strict';

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

const tracing = require('@opencensus/nodejs');
const {StackdriverTraceExporter} = require('@opencensus/exporter-stackdriver');
const {TraceContextFormat} = require('@opencensus/propagation-tracecontext');

/**
 * Initialize tracing
 * @return {Tracer} tracer object
 */
module.exports.initTracing = () => {
  const traceContext = new TraceContextFormat();
  const tracer = tracing.start({
    samplingRate: 1,
    exporter: getExporter(),
    propagation: traceContext,
  }).tracer;
  return tracer;
};

function getExporter() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    console.error('Project id not defined');
    // Running on GKE, we should be able to omit the project ID
    return new StackdriverTraceExporter();
  } 
  console.log(`Exporting traces to project ${projectId}`);
  return new StackdriverTraceExporter({
    projectId: projectId});
}