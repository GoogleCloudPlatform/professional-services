var set = require('./set')
  , is = require('./is')

module.exports = function push(value){
  return function(o){
    return is.arr(o) 
         ? set({ key: o.length, value: value, type: 'add' })(o)
         : o 
  }
}