module.exports = function prepend(v) {
  return function(d){
    return v+d
  }
}