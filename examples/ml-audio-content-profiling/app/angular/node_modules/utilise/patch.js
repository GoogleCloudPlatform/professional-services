var keys = require('./keys')
  , set = require('./set')
  
module.exports = function patch(key, values){
  return function(o){
    return keys(values)
      .map(function(k){
        return set({ key: key + '.' + k, value: values[k], type: 'update' })(o)
      }), o
  }
}