var key = require('./key')

module.exports = function header(header, value) {
  var getter = arguments.length == 1
  return function(d){ 
    return !d || !d.headers ? null
         : getter ? key(header)(d.headers)
                  : key(header)(d.headers) == value
  }
}