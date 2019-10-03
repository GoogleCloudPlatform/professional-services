var clone = require('./clone')
  , key = require('./key')
  , by = require('./by')
  , is = require('./is')

module.exports = function join(left, right){
  if (arguments.length == 1) {
    right = left
    left = null
  }

  return function(d, uid){
    if (d === null || d === undefined) return undefined
    var table = right || [], field = null
    if (!uid || is.num(uid)) uid = 'id'
    if (is.str(right)) {
      var array = right.split('.')
      table = ripple(array.shift())
      field = array.join('.')
    }
    
    var id  = key(left)(d)
      , val = table
                .filter(by(uid, id))
                .map(key(field))
                .pop() || {}

    return left 
      ? key(left, val)(d) 
      : val
  }
}
