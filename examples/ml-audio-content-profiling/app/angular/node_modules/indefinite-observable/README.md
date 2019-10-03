# Indefinite Observable ##

<!-- TODO: update version number before releasing -->
![Current version:](https://img.shields.io/badge/v1.0.2:-222222.svg?logo=npm)
[![Test status](https://img.shields.io/circleci/project/github/material-motion/indefinite-observable-js/stable.svg?logo=circleci&label=Tests)](https://circleci.com/gh/material-motion/indefinite-observable-js/tree/stable)
[![Code coverage](https://img.shields.io/codecov/c/github/material-motion/indefinite-observable-js/stable.svg?logo=codecov&logoColor=white&label=Coverage)](https://codecov.io/gh/material-motion/indefinite-observable-js/branch/stable)<br />
![HEAD:](https://img.shields.io/badge/HEAD:-222222.svg?logo=github&logoColor=white)
[![Test status](https://img.shields.io/circleci/project/github/material-motion/indefinite-observable-js/develop.svg?logo=circleci&label=Tests)](https://circleci.com/gh/material-motion/indefinite-observable-js/tree/develop)
[![Code coverage](https://img.shields.io/codecov/c/github/material-motion/indefinite-observable-js/develop.svg?logo=codecov&logoColor=white&label=Coverage)](https://codecov.io/gh/material-motion/indefinite-observable-js/branch/develop)

## Why? ##

There are a lot of great Observable implementations, but they're baked into featureful libraries which contribute to both complexity and filesize.  We wanted the simplest-possible Observable implementation, with no operators, no fancy scheduling.  The entire thing is basically [three statements in `subscribe`](https://github.com/material-motion/indefinite-observable-js/blob/develop/src/IndefiniteObservable.ts#L68-L72).

Indefinite Observable is a subset of the [TC39 Observable proposal](https://tc39.github.io/proposal-observable/) that never `complete`s or `error`s.  It implements the [minimal-necessary functionality](https://en.wikipedia.org/wiki/You_aren't_gonna_need_it), but it should be completely interchangeable with the TC39 proposal for the subset that it does implement.

If you want a complete Observables library that works out-of-the-box, check out [xstream](https://github.com/staltz/xstream/), [RxJS](https://github.com/ReactiveX/RxJS/), [Most](https://github.com/cujojs/most/), [Bacon](https://github.com/baconjs/bacon.js/), or [Kefir](https://github.com/rpominov/kefir/).  If you want to build your own Observables library that includes just the functionality you need, try [Indefinite Observable](https://github.com/material-motion/indefinite-observable-js/#indefinite-observable).

## Usage ##

```javascript
import IndefiniteObservable from 'indefinite-observable';

const moveEvent$ = new IndefiniteObservable(
  (observer) => {
    // Whenever you want the observable to dispatch a value, call
    // observer.next(value).
    element.addEventListener('pointermove', observer.next);

    // Return a function that will perform any necessary clean up when the
    // observable is unsubscribed from.
    return () => {
      element.removeEventListener('pointermove', observer.next);
    }
  }
);

// To receive the values dispatched by an observable, pass an observer to its
// subscribe method.  An observer is just an object with a next method.
//
// subscribe returns a unsubscribe function.  Call that when you no longer want
// to receive dispatches from the observable.
const unsubscribe = moveEvent$.subscribe({
  next(moveEvent) {
    console.log('got a pointer event: ', moveEvent);
  }
});
```

Learn more about [How Indefinite Observables work](https://material-motion.github.io/material-motion/documentation/IndefiniteObservable).

## Installation ##

```
yarn add indefinite-observable
```

or include as a script tag:

```
<script src = "https://ajax.googleapis.com/ajax/libs/indefinite-observable/1.0.1/indefinite-observable.js"></script>
```

## Contributing ##

This library aims to be as simple as possible, so modifications will be rare.  Reasons we might make changes are limited to:

- bugs, or
- remaining compatible with the subset of the Observable spec that we support.

If you'd like to add operators, static methods, or other features, we invite you to depend upon us subclassing `IndefiniteObservable` in your own module.  In fact, [that's how we add features too](https://github.com/material-motion/material-motion-js/blob/develop/packages/core/src/observables/MotionObservable.ts).

Of course, we welcome improvements to the examples and documentation in this repo.

### Bundling ###

Our source is available in 3 flavors: a TypeScript module, a JavaScript module, and a JavaScript bundle.  Any changes made to the first need to be reflected in the other two.  This should be handled for you automatically via a pre-commit hook.  If you have a clean working copy after committing, you're good.  If not, amend the commit with the new build before pushing.

If you need to bundle it independently, run

```
yarn run build
```

### Testing ###

```
yarn run test
```

## License ##

[Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0)
