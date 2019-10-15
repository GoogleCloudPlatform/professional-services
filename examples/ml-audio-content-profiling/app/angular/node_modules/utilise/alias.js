var fs = require('fs')
  , path = require('path')
  , is = require('utilise.is')
  , log = require('utilise.log')
  , not = require('utilise.not')
  , file = require('utilise.file')
  , args = require('utilise.args')
  , keys = require('utilise.keys')
  , values = require('utilise.values')
  , append = require('utilise.append')
  , prepend = require('utilise.prepend')
  , replace = require('utilise.replace')
  , includes = require('utilise.includes')
  , core = ['package.json', 'alias.js']
  , browser = require('./package.json').browser
  , alias = "module.exports = require('{mod}')"
  , entry = "require('./owner').{key} = require('{mod}')"
  , modules = keys(require('./package.json').devDependencies)
      .filter(includes('utilise'))
      .map(replace('utilise.', ''))

// clean dir
fs.readdirSync(__dirname)
  .filter(includes('js'))
  .filter(not(is.in(core)))
  .map(prepend(__dirname+'/'))
  .map(log('deleting'))
  .map(fs.unlinkSync)

// create utilise/{name} aliases
modules
  .map(append('.js'))
  .map(log('creating'))
  .map(args(0)(fs.createWriteStream))
  .map(function(s){ 
    var key = s.path.slice(0,-3)
      , req = file('./node_modules/utilise.'+key+'/index.js')
      , out = req.replace(/utilise./g, 'utilise/')

    s.write(out)
  })

// expose single node entry point
var index = fs.createWriteStream('index.js')
modules
  .map(function(key){ 
    return entry
      .replace('{key}', key) 
      .replace('{mod}', './'+key+'.js')
  })
  .map(append('\n'))
  .map(args(0)(index.write, index))

// expose single browser entry point
var tmp = fs.createWriteStream('tmp.js')
modules
  .filter(not(is.in(browser)))
  .map(function(key){ 
    return entry
      .replace('{key}', key) 
      .replace('{mod}', './'+key+'.js') 
  })
  .map(append('\n'))
  .map(args(0)(tmp.write, tmp))

function module(key){ console.log('key', key)
  return modules[key].split('/').pop().slice(0,-4)
}
