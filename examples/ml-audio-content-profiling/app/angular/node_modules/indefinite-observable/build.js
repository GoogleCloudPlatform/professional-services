/** @license
 *  Copyright 2016 - present The Material Motion Authors. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may not
 *  use this file except in compliance with the License. You may obtain a copy
 *  of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *  License for the specific language governing permissions and limitations
 *  under the License.
 */

const {
  readFileSync,
  writeFileSync,
} = require('fs');

const licenseText = `/** @license
 *  Copyright 2016 - present The Material Motion Authors. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may not
 *  use this file except in compliance with the License. You may obtain a copy
 *  of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *  License for the specific language governing permissions and limitations
 *  under the License.
 */
"use strict";`;

const observableSource = readFileSync('./dist/IndefiniteObservable.js').toString();
const wrapWithObserverSource = readFileSync('./dist/wrapWithObserver.js').toString();
const symbolObservable = readFileSync('./third_party/symbol-observable/index.js').toString();

writeFileSync(
  './dist/indefinite-observable.js',
  licenseText + '\n' +[
    observableSource.replace(licenseText, ''),
    wrapWithObserverSource.replace(licenseText, ''),
  ].join('\n\n').replace(
    /const symbol_observable_\d = require\("symbol-observable"\);/,
    symbolObservable
  ).replace(
    /const symbol_observable_\d = require\("symbol-observable"\);/,
    ''
  ).replace(
    /const wrapWithObserver_\d = require\(".\/wrapWithObserver"\);/g,
    ''
  ).replace(
    // strip comments
    /\n^\s*\/\/.*$/mg,
    ''
  ).replace(
    /symbol_observable_\d\.default/g,
    '$$observable'
  ).replace(
    /wrapWithObserver/g,
    '_wrapWithObserver'
  ).replace(
    /_wrapWithObserver_\d\.default/g,
    '_wrapWithObserver'
  ).replace(
    /Object\.defineProperty\(exports, "__esModule", \{ value: true \}\);/g,
    ''
  ).replace(
    /exports\.default = \w+;/g,
    ''
  ).replace(
    /\n\n+/g,
    '\n\n'

  // Use 2 spaces instead of 4 in the TypeScript output to keep comments wrapped
  // to 80 chars.  If we ever try to use spaces for alignment (independent of
  // indentation), this regex will need to be revisited.
  ).replace(
    /    /g,
    '  '
  )
);
