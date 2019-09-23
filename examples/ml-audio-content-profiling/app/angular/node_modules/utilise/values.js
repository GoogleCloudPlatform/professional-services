var keys = require('./keys')
  , from = require('./from')

module.exports = function values(o) {
  return !o ? [] : keys(o).map(from(o))
}