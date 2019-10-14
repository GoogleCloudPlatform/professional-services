# Ripple | Core
[![Coverage Status](https://coveralls.io/repos/rijs/core/badge.svg?branch=master&service=github)](https://coveralls.io/github/rijs/core?branch=master)
[![Build Status](https://travis-ci.org/rijs/core.svg)](https://travis-ci.org/rijs/core)


A simple extensible in-memory data structure of resources. 

```js
var ripple = core()

ripple(name, body) // setter
ripple(name)       // getter
```

You can also use the method-chained API:

```js
ripple                
  .resource(name, body)
  .resource(name, body)
  ...
```

The resources it registers are accesible under `ripple.resources`.

A **canonical** resource is an object with the following shape and three properties:

```js
{ name: 'foo'
, body: 'bar'
, headers: { 'content-type': 'text/plain' }
}
```

That is, it can be uniquely identified (`name`), the resource itself (`body`) and some arbitrary metadata (`headers`). Core only deals with the `content-type` header, however other modules may add and interpret their own per-resource metadata.

Core only comes with one _type_ (`text/plain`) out of the box, so will fail to register anything other than a string. This is to make it very extensible and future-proof, such that you could for example create other exotic types like `application/jsx`, `text/jade` or `data/immutable`.

Note that you do not have to register a canonical resource, you will most likely use shortcuts in your application code (see [API](https://github.com/rijs/core#api) for more).

```js
ripple('foo', 'bar')

// will result in ripple.resources ===
{
  foo: { name: 'foo'
       , body: 'bar'
       , headers: { 'content-type': 'text/plain' }
       }
}
```

## Resource Interpretation

When an content-type header is not explicitly given, core will loop through it's registered types and see if any of them understand this particular resource (by passing `{ name, body, headers }` to each type `check` function). If any of them do:

* The `content-type` header will be set
* The type `parse` function will be run on the resource
* The resource will be stored internally
* A [change event](https://github.com/rijs/core#--event) will be emitted

You'll need to extend `ripple.types` to tell it how to interpret other resources. Each type object should have the following:

```js
{ header: 'the content type you are registering'
, check: function // necessary
, parse: function // optional
}
```

The `parse` function is a chance to initialise the resource, set default headers, etc. Some examples: 
* `application/data` - [proxies change events](https://github.com/rijs/data/blob/master/src/index.js#L10-L21) so you can do per-resource change listeners `ripple('data').on('change, fn)`
* `application/javascript` - turns a [function as a string into a real function](https://github.com/rijs/fn/blob/master/src/index.js#L9) (useful since streamed over WS).

Other modules can also extend existing parse functions. For example, `sync` [extends every type parse function](https://github.com/rijs/sync/blob/master/src/index.js#L99-L113) to add the ability to define server/client transformation functions. 

See other existing vanilla types for more examples: [Data](https://github.com/rijs/data), [Versioned Data](https://github.com/rijs/versioned), [Functions](https://github.com/rijs/fn), [HTML](https://github.com/rijs/html), [CSS](https://github.com/rijs/css).

## Event

The core instance is [emitterified](https://github.com/utilise/utilise#--emitterify). Whenever a resource is registered, a change event will be emitted.

```js
ripple.on('change', doSomething)
```

## API

```js
ripple('name')                   // - returns the resource body if it exists
ripple('name', body)             // - creates & returns resource, with specified name and body
ripple('name', body, headers })  // - creates & returns resource, with specified name, body and headers
ripple({ name, body, headers })  // - creates & returns resource, with specified name, body and headers
ripple([ ... ])                  // - calls ripple on each item - registers an array of resources
ripple.resources                 // - returns raw resources
ripple.resource                  // - alias for ripple, returns ripple instead of resource for method chaining
ripple.register                  // - alias for ripple
ripple.on                        // - event listener for changes - all resources
```
