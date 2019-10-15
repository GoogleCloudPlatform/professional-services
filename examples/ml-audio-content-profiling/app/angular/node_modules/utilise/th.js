module.exports = function th(fn) {
  return function(){
    return fn(this).apply(this, arguments)
  }
}
