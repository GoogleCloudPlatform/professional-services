module.exports = function append(v) {
  return function(d){
    return d+v
  }
}