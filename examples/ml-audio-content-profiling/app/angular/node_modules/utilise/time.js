module.exports = function time(ms, fn) {
  return arguments.length === 1 
       ? setTimeout(ms)
       : setTimeout(fn, ms)
}