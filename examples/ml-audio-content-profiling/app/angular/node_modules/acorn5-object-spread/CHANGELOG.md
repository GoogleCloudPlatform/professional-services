# acorn5-object-spread changelog

## 4.0.0

* Remove support for complex rest properties since they are forbidded by the
  spec

## 3.1.0

* Support complex rest properties like `{...{a = 5, ...as}}`
* Support rest properties in arrow function arguments
* Fail if rest property is not last property or has a trailing comma
* Detect duplicate exports with rest properties
* Don't complain about duplicate property names in patterns

## 3.0.0

* Support rest properties
* Emit `SpreadElement` instead of `SpreadProperty` nodes
