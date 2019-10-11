# Ripple | Data
[![Coverage Status](https://coveralls.io/repos/rijs/data/badge.svg?branch=master&service=github)](https://coveralls.io/github/rijs/data?branch=master)
[![Build Status](https://travis-ci.org/rijs/data.svg)](https://travis-ci.org/rijs/data)

Extends [core](https://github.com/rijs/core#ripple--core) to register objects and arrays. It also enables per-resource change listeners on those resources, as well versioning info.

```js
ripple('data', [])
```

All data resources will be [emitterified](https://github.com/utilise/utilise#--emitterify):

```js
// instead of: ripple.on('change', function(name, change){ .. })
ripple('name').on('change', function(change){ .. })
ripple('name').once('change', function(change){ .. })
ripple('name').emit('change')
```

All data resources will be initialised with [versioning info](https://github.com/utilise/utilise#--set):

```js 
ripple('name').log
```