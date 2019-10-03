# Examples / Test Cases

This folder contains a number of test cases which can also serve as
usage examples.

Each folder contains a bog-standard Webpack project and an optional
file `test.js` for more intricate tests.

## Adding a Test Case

In order to create a new test case, it's probably best to start by
copying an existing example.  Simply copy the directory to a new name,
then edit `README.md`, `webpack.config.js` and optionally `test.js`.
You can run all examples using `yarn mocha`, or a specific example
using `yarn mocha --grep 'titlehere'`.

The simplest kind of example is an end-to-end test.  This is just a
vanilla Webpack project: a `webpack.config.js` and any files that you
want to bundle.  To pass a test, such an example should provide an
`index.html` and use `console.log` somewhere to output `ok` when
loaded in a web browser.  To fail, it should output `error`. (If it
doesn't output either `ok` or `error` it will time out.)

However, end-to-end tests are also the slowest performing and aren't
well suited to examining the Webpack build output.  For your case it
might be better to add a file `test.js` with contents as follows:

- For examining only webpack build output, export a function `check`
  with one argument `stats`:

  ```js
  module.exports.check = function check(stats) {
  }
  ```

  The function should examine stats and throw in case of error.  It
  can also return a promise.

- For examining Webpack build output with a web server serving the
  output spun up, add another argument `url`:

  ```js
  module.exports.check = function check(stats, url) {
  }
  ```

- If you want a Puppeteer browser instance, add yet another argument
  `browser`.  Your tests will be skipped on Node versions < 6.4.

  ```js
  module.exports.check = function check(stats, url, browser) {
  }
  ```

- You can export a function `skip` if you want to skip the test
  conditionally.  The function should return a truthy value when the
  test should be skipped.

## Reference

Any sub-directories of this directory are processed as follows:

Each sub-directory should contain a file called `webpack.config.js`
which exports a standard Webpack configuration as default.

It can optionally contain a file called `test.js` with the following
exports:

- `check`: a function that will be invoked after Webpack compilation
  finishes successfully.  It should return a Promise that resolves if
  the test succeeds and rejects if it fails.  Synchronous tests can
  also return a non-promise value or throw.

  The function can receive between zero and three arguments. The first
  argument, if needed, is the `stats` object that the Webpack
  compilation returns.  The second argument, if needed, is the URL of
  a web server hosting the results of the Webpack compilation.  The
  third argument, if needed, is a Puppeteer browser instance.

  If the function accepts all three arguments, it will only run on
  Node >= 6.4 since that is the minimum requirement of Puppeteer.
  Therefore, don't specify the third argument if you don't need it so
  that your test can run on Node 4.

  The web server will only be spun up if the function accepts two
  arguments or more.  Therefore, don't specify the second argument if
  you don't need it so that your test runs faster.

  If the `check` export is not present (or the whole `test.js` file is
  missing), a default check will be run.  The default check ensures
  that there were no compilation errors, then loads `index.html` with
  Puppeteer and waits for it to log either `ok` or `error` to the
  console.

- `skip`: a function that, if present, will be invoked without
  arguments.  Its return code determines whether the test should be
  skipped (truthy return value means to skip the test, falsey means to
  run it.)
