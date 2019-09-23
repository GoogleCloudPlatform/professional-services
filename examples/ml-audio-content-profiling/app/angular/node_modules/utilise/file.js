module.exports = function file(name){
  return require('fs').readFileSync(name, { encoding:'utf8' })
}