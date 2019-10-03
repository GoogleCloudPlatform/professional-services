var is = require('./is')

module.exports = function keys(o) { 
  return Object.keys(is.obj(o) || is.fn(o) ? o : {})
}