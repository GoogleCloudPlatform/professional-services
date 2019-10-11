module.exports = function escape(str) {
  return str.replace(/[&<>'"]/g, function(char){
    return safe[char]
  })
}

var safe = { 
  "&": "&amp;"
, "<": "&lt;"
, ">": "&gt;"
, '"': "&quot;"
, "'": "&#39;"
}
