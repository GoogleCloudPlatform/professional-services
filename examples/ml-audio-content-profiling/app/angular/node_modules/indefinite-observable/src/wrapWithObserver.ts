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

import {
  Observer,
  ObserverOrNext,
} from './types';

// TypeScript is a pain to use with polymorphic types unless you wrap them in a
// function that returns a single type.  So, that's what this is.
//
// If you give it an observer, you get back that observer.  If you give it an
// anonymous function, you get back that anonymous function wrapped in an
// observer.
export default function wrapWithObserver<T>(listener: ObserverOrNext<T>): Observer<T> {
  if (typeof listener === 'function') {
    return {
      next: listener
    };

  } else {
    return listener;
  }
}
