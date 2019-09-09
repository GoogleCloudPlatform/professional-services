module.exports = function done(o) {
  return function(then){
    o.once('response._' + (o.log.length - 1), then)
  }
}