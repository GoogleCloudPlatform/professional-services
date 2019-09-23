module.exports = function logsView(node, { results }){
  const id = location.pathname.split('dashboard/').pop().replace(/-$/, '-?')
  
  raw('#output').innerHTML = results[id] 
    ? results[id].html 
    : 'No connected agent yet..'
}