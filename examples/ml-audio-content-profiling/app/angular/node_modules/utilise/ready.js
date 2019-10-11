module.exports = function ready(fn){
  return document.body ? fn() : document.addEventListener('DOMContentLoaded', fn.bind(this))
}
