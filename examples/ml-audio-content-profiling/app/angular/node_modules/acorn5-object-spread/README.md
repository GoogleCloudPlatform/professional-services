# Spread and rest properties support in acorn 5

[![NPM version](https://img.shields.io/npm/v/acorn5-object-spread.svg)](https://www.npmjs.org/package/acorn5-object-spread)

This is plugin for [Acorn](http://marijnhaverbeke.nl/acorn/) - a tiny, fast JavaScript parser, written completely in JavaScript.

It implements support for spread and rest properties as defined in the stage 3 proposal [Object Rest/Spread Properties for ECMAScript](https://github.com/tc39/proposal-object-rest-spread).

## Usage

You can use this module directly in order to get an Acorn instance with the plugin installed:

```javascript
var acorn = require('acorn5-object-spread');
```

Or you can use `inject.js` for injecting the plugin into your own version of Acorn like this:

```javascript
var acorn = require('acorn5-object-spread/inject')(require('./custom-acorn'));
```

Then, use the `plugins` option whenever you need to support object spread or rest while parsing:

```javascript
var ast = acorn.parse(code, {
  plugins: { objectSpread: true }
});
```

## Differences to acorn-object-rest-spread

[acorn-object-rest-spread](https://github.com/victor-homyakov/acorn-object-rest-spread)
is another acorn plugin implementing the same spec. There are some differences, though:

* acorn-object-rest-spread overwrites acorn's `parseObj` with a modified copy from acorn 4,
  so that an acorn instance with that plugin cannot for example parse `({async, foo})`
  and [wrongly complains about duplicate property names in patterns](https://github.com/ternjs/acorn/commit/4ee71d7c67f73c407c5f6e28f743858b936ea885).
* acorn-object-rest-spread emits `SpreadElement`s with a
  [non-standard](https://github.com/estree/estree/blob/master/es2015.md#expressions)
  `value` property
* acorn-object-rest-spread emits `SpreadElement`s in arrow function argument patterns
  and nested object patterns were it should emit `RestElement`s
* acorn-object-rest-spread doesn't check for invalid trailing commas in rest properties

## License

This plugin is issued under the [MIT license](./LICENSE).

With <3 by UXtemple.
