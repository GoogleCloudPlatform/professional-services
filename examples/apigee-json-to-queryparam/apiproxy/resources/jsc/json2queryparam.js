/*
 ~ Copyright (C) 2022 Google Inc.
 ~
 ~ Licensed under the Apache License, Version 2.0 (the "License"); you may not
 ~ use this file except in compliance with the License. You may obtain a copy of
 ~ the License at
 ~
 ~ http://www.apache.org/licenses/LICENSE-2.0
 ~
 ~ Unless required by applicable law or agreed to in writing, software
 ~ distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 ~ WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 ~ License for the specific language governing permissions and limitations under
 ~ the License.
 */


var jsonpayload = context.getVariable("request.content");
var payload = JSON.parse(jsonpayload);
// TODO: check for errors in payload

// ASSUME: flat property payload - no embedded arrays or objects
// ASSUME: no duplicated property names.
for( var property in payload) {
    context.setVariable("request.queryparam."+property, payload[property]);
}

// Change method from POST/PATCH/ whatever to GET
context.setVariable("request.verb", "GET");