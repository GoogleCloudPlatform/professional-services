module.exports = function replace(from, to){
  return function(d){
    return d.replace(from, to)
  }
}