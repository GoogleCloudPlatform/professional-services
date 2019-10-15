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

import IndefiniteObservable from '../../src';

// Make a subclass of IndefiniteObservable to hold whatever operators you like.
class MyStream extends IndefiniteObservable {
  map(predicate) {
    return new MyStream(
      (observer) => {
        let subscription = this.subscribe(
          (value) => {
            observer.next(
              predicate(value)
            );
          }
        );

        return subscription.unsubscribe;
      }
    );
  }
}

function createMove$(element) {
  let observers = new Set();

  return new MyStream(
    (observer) => {
      element.addEventListener('mousemove', observer.next);

      console.log('starting move$');
      observers.add(observer);
      updateInnerText();

      return function unsubscribe () {
        element.removeEventListener('mousemove', observer.next);

        console.log('stopping move$');
        observers.delete(observer);
        updateInnerText();
      }
    }
  );

  function updateInnerText() {
    let observerCount = observers.size;

    element.innerHTML = `observer count: ${ observerCount }`;

    if (observerCount) {
      element.innerHTML = `<div><strong>move your pointer here.</strong><br /><br />${ element.innerHTML }</div>`;
    }
  }
}

let track = document.getElementById('track');
let doubled = document.getElementById('doubled');
let excited = document.getElementById('excited');

let move$ = createMove$(track).map(
  event => event.pageX
);

let doubledMove$ = move$.map(
  x => x + x
);

let excitedMove$ = move$.map(
  x => x + "!!!"
);

let doubledSubscription = doubledMove$.subscribe({
  next(value) {
    doubled.innerText = "doubled: " + value;
  }
});

let excitedSubscription = excitedMove$.subscribe(
  value => excited.innerText = "excited: " + value
);

doubled.addEventListener(
  'click',
  () => {
    doubledSubscription.unsubscribe();
    doubled.innerText = 'unsubscribed';
  }
);

excited.addEventListener(
  'click',
  () => {
    excitedSubscription.unsubscribe();
    excited.innerText = 'unsubscribed';
  }
);
