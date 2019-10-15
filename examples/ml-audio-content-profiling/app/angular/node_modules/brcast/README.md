# Brcast

> Tiny data broadcaster with 0 dependencies

[![Travis](https://img.shields.io/travis/vesparny/brcast.svg)](https://travis-ci.org/vesparny/brcast)
[![Code Coverage](https://img.shields.io/codecov/c/github/vesparny/brcast.svg?style=flat-square)](https://codecov.io/github/vesparny/brcast)
[![David](https://img.shields.io/david/vesparny/brcast.svg)](https://david-dm.org/vesparny/brcast)
[![npm](https://img.shields.io/npm/v/brcast.svg)](https://www.npmjs.com/package/brcast)
[![npm](https://img.shields.io/npm/dm/brcast.svg)](https://npm-stat.com/charts.html?package=brcast&from=2017-04-01)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![MIT License](https://img.shields.io/npm/l/brcast.svg?style=flat-square)](https://github.com/vesparny/brcast/blob/master/LICENSE)

The current size of `brcast/dist/brcast.umd.min.js` is:

[![gzip size](http://img.badgesize.io/https://unpkg.com/brcast/dist/brcast.umd.min.js?compression=gzip&label=gzip%20size&style=flat-square)](https://unpkg.com/brcast/dist/)

It's like a data store you can subscribe to, with a setter to pump data in.
For browsers and node.

## Table of Contents

-   [Install](#install)
-   [Usage](#usage)
-   [API](#API)
-   [Testing](#tests)
-   [License](#license)

## Install

This project uses [node](http://nodejs.org) and [npm](https://npmjs.com). Go check them out if you don't have them locally installed.

```sh
$ npm install --save brcast
```

Then with a module bundler like [rollup](http://rollupjs.org/) or [webpack](https://webpack.js.org/), use as you would anything else:

```javascript
// using ES6 modules
import brcast from 'brcast'

// using CommonJS modules
var brcast = require('brcast')
```

The [UMD](https://github.com/umdjs/umd) build is also available on [unpkg](https://unpkg.com):

```html
<script src="https://unpkg.com/brcast/dist/brcast.umd.js"></script>
```

You can find the library on `window.brcast`.

## Usage

```js
import brcast from 'brcast'

let broadcast = brcast()

// subscribe
const subscriptionId = broadcast.subscribe(state => console.log(state))

// setState sets the state and invoke all subscription callbacks passing in the state
broadcast.setState(1)

// setState returns the current state
broadcast.getState()

// unsubscribe to unbind the handler
broadcast.unsubscribe(subscriptionId)
```

## API

### `brcast([initialState])`

Creates a `broadcast` object.

#### Arguments

1 - [`initialState`] *(any)*: The initial state.

#### Returns

(`broadcast`): An object that holds the state.

### `broadcast.setState(state)`

Store the new state.

#### Arguments

1 - `state` *(any)*: The new state.

#### Returns

Nothing.

### `broadcast.getState()`

Get the stored state.

#### Returns

(`Any`): The stored state.

### `broadcast.subscribe(handler)`

Subscribe to state changes.

#### Arguments

1 - `handler` *(Function)*: The callback to be invoked any time the state changes.

#### Returns

(`Number`): The subscription id to be used to unsubscribe.

### `broadcast.unsubscribe(subscriptionId)`

Unsubscribe the change listener.

#### Arguments

1 - `subscriptionId` *(Number)*: The subscription id returned by subscribing.

#### Returns

Nothing.

## Tests

```sh
$ npm run test
```


[MIT License](LICENSE.md) © [Alessandro Arnodo](https://alessandro.arnodo.net/)
