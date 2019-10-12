module.exports = function copy(from, to){ 
  return function(d){ 
    return to[d] = from[d], d
  }
}