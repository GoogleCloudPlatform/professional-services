var to = require('./to')
  , is = require('./is')

module.exports = function grep(o, k, regex){
  var original = o[k] 
  o[k] = function(){ 
    var d = to.arr(arguments).filter(is.str).join(' ')
    return d.match(regex) && original.apply(this, arguments) 
  }
  return original
}