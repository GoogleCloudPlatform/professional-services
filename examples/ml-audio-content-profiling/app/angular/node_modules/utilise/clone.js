var parse = require('./parse')
  , str = require('./str')
  , is = require('./is')

module.exports = function clone(d) {
  return !is.fn(d) && !is.str(d)
       ? parse(str(d))
       : d
}
