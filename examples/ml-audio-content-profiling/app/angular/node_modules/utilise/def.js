var has = require('./has')

module.exports = function def(o, p, v, w){
  if (o.host && o.host.nodeName) o = o.host
  if (p.name) v = p, p = p.name
  !has(o, p) && Object.defineProperty(o, p, { value: v, writable: w })
  return o[p]
}
