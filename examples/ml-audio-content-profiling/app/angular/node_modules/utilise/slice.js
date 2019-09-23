module.exports = function slice(from, to){
  return function(d){
    return d.slice(from, to)
  }
}