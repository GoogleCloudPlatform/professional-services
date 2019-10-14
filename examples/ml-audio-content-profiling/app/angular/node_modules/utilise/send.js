module.exports = function send(path){
  return function(req, res){
    res.sendFile(path)
  }
}