var is = require('./is')
  , not = require('./not')
  , keys = require('./keys')
  , copy = require('./copy')

module.exports = function extend(to){ 
  return function(from){
    keys(from)
      .filter(not(is.in(to)))
      .map(copy(from, to))

    return to
  }
}