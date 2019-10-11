module.exports = function sort(fn){
  return function(arr){
    return arr.sort(fn)
  }
}
