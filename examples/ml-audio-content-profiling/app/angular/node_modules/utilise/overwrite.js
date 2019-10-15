var is = require('./is')
  , keys = require('./keys')
  , copy = require('./copy')

module.exports = function overwrite(to){ 
  return function(from){
    keys(from)
      .map(copy(from, to))
        
    return to
  }
}