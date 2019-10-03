var is = require('./is')

module.exports = function stripws(d){
  return (is.arr(d) ? d[0] : d)
    .replace(/([\s]{2,}|[\n])/gim, '')
}