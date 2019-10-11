module.exports = function not(fn){
  return function(){
    return !fn.apply(this, arguments)
  }
}