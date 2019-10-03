module.exports = function flatten(p,v){ 
  if (v instanceof Array) v = v.reduce(flatten, [])
  return (p = p || []), p.concat(v) 
}
