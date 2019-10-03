module.exports = function draw(host, fn, state) {
  var el = host.node ? host.node() : host
  el.state = state || {}
  el.draw = function(d){ return fn && fn.call(el, el, el.state) }
  el.draw()
  return host
}