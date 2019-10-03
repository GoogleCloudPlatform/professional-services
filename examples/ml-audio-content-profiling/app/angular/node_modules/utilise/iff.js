module.exports = function iff(condition){
  return function(handler){
    return function(){
      if (condition.apply(this, arguments))
        return handler.apply(this, arguments)
    }
  }
}