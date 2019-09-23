var key = require('./key')
  , to  = require('./to')

module.exports = function az() {
  return compare(to.arr(arguments))
}

function compare(keys){ 
  return function(a, b){
    if (!keys.length) return 0
    var k = keys[0]
      , ka = key(k)(a) || ''
      , kb = key(k)(b) || ''

    return ka < kb ?  1 
         : ka > kb ? -1 
         : compare(keys.slice(1))(a, b)
  }
}