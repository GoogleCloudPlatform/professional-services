const core = require('rijs.core')
    , data = require('rijs.data')
    , sync = require('rijs.sync')

const ripple = sync(data(core()))
    , all    = require('utilise/all')
    , raw    = require('utilise/raw')
    , to     = require('utilise/to')
    , con    = window.console

// send tests-starting signal
ripple.send('results', 'SAVE', { 
  stats: { running: true }
, suites: []
, html: 'Test in progress..'
})

// proxy errors back to terminal
// window.onerror = (message, url, linenumber) => 
//   ripple.io.emit('global err', message, url, linenumber)

// proxy console logs back to terminal
;['log', 'info', 'warn', 'error', 'debug'].map(m => {
  if (!con || !con[m]) return; // ie
  const sup = Function.prototype.bind.call(con[m], con)
  window.console[m] = function(){
    const args = to.arr(arguments)
    // ripple.io.emit('console', m, args.map(d => d))
    sup.apply && sup.apply(con, arguments)
  }
})

// send final results back
window.finish = function(){
  const stats = this.stats
  stats.running = false
  ripple.send('results', 'SAVE', { 
    stats
  , suites: all('#mocha-report > .suite').map(suite)
  , html: raw('#mocha').innerHTML
  })
}

function suite(s){
  return {
    name: raw('h1', s).textContent
  , total: '' + all('.test', s).length
  , failures: '' + all('.fail', s).length
  }
}