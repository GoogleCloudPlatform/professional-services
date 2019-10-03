module.exports = function split(delimiter){
  return function(d){
    return d.split(delimiter)
  }
}
