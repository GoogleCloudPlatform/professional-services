module.exports = promise

function promise() {
  var resolve
    , reject
    , p = new Promise(function(res, rej){ 
        resolve = res, reject = rej
      })

  arguments.length && resolve(arguments[0])
  p.resolve = resolve
  p.reject  = reject
  return p
}