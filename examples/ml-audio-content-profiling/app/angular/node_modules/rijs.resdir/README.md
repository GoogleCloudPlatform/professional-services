# Ripple | Resources Directory
[![Coverage Status](https://coveralls.io/repos/rijs/resdir/badge.svg?branch=master&service=github)](https://coveralls.io/github/rijs/resdir?branch=master)
[![Build Status](https://travis-ci.org/rijs/resdir.svg)](https://travis-ci.org/rijs/resdir)

Loads everything in your `./resources` directory on startup so you do not have to require and register each file manually. During development, this will watch for any changes in your resources folder and reregister it on change. So if you change a resource it will be synchronised with the client, then redrawn without any refreshes (hot reload). See [rijs/export](https://github.com/rijs/export#ripple--export) for similar if you are using Ripple without a server.

Styles (CSS) will registered under the name matching their filename (with `.css`)

Components (JS) will registered under the name matching their filename (without `.js`)