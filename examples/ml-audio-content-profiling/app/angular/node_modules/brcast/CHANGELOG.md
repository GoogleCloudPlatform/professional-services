# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="3.0.1"></a>
## [3.0.1](https://github.com/vesparny/brcast/compare/v3.0.0...v3.0.1) (2017-08-16)


### Bug Fixes

* point jsnext:main to the transpiled es module closes #7 ([9b182e2](https://github.com/vesparny/brcast/commit/9b182e2)), closes [#7](https://github.com/vesparny/brcast/issues/7)



<a name="3.0.0"></a>
# [3.0.0](https://github.com/vesparny/brcast/compare/v2.0.2...v3.0.0) (2017-08-02)


### Performance Improvements

* improve performance by not allocating an unsubscribe function for ([e70f01e](https://github.com/vesparny/brcast/commit/e70f01e))


### BREAKING CHANGES

* subscribe does not return a function anymore, but a
subscriptionId instead



<a name="2.0.2"></a>
## [2.0.2](https://github.com/vesparny/brcast/compare/v2.0.1...v2.0.2) (2017-07-27)


### Bug Fixes

* prevent handlers unsubscribed in the middle of setState from being called (#5) ([3ad6f58](https://github.com/vesparny/brcast/commit/3ad6f58))



<a name="2.0.1"></a>
## [2.0.1](https://github.com/vesparny/brcast/compare/v2.0.0...v2.0.1) (2017-06-28)


### Bug Fixes

* increase performance by using an object literal for storing listeners ([4d36f91](https://github.com/vesparny/brcast/commit/4d36f91))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/vesparny/brcast/compare/v1.1.6...v2.0.0) (2017-04-19)


### Chores

* remove mitt dependency ([52929e6](https://github.com/vesparny/brcast/commit/52929e6))


### BREAKING CHANGES

* does not support channel anymore



<a name="1.1.6"></a>
## [1.1.6](https://github.com/vesparny/brcast/compare/v1.1.4...v1.1.6) (2017-04-08)



<a name="1.1.4"></a>
## [1.1.4](https://github.com/vesparny/brcast/compare/v1.1.3...v1.1.4) (2017-04-08)



<a name="1.1.3"></a>
## [1.1.3](https://github.com/vesparny/brcast/compare/v1.1.2...v1.1.3) (2017-04-07)



<a name="1.1.2"></a>
## [1.1.2](https://github.com/vesparny/brcast/compare/v1.1.1...v1.1.2) (2017-04-07)



<a name="1.1.1"></a>
## [1.1.1](https://github.com/vesparny/brcast/compare/v1.1.0...v1.1.1) (2017-04-07)



<a name="1.1.0"></a>
# 1.1.0 (2017-04-07)


### Features

* **lib:** init ([cefcbb2](https://github.com/vesparny/brcast/commit/cefcbb2))
