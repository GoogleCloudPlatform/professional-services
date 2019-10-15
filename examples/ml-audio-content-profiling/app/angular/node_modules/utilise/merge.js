var is = require('./is')

module.exports = merge

function merge(to){ 
  return function(from){
    for (x in from) 
      is.obj(from[x]) && is.obj(to[x])
        ? merge(to[x])(from[x])
        : (to[x] = from[x])
    return to
  }
}