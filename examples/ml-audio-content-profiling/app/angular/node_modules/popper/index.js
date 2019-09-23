module.exports = function popper({ 
  tests = 'browserify test.js'
, farm = 'browserstack'
, notunnel = false
, runner = 'mocha'
, browsers = []
, globals = ''
, port = 1945
, watch = '.'
, opts = {}
, timeout
, ripple
} = {}){
   
  // defaults
  const wait = debounce(timeout = timeout || +env.POPPER_TIMEOUT || 20000)(quit)
      , maxRetries = 3

  ripple = (ripple || rijs)(extend({ dir, port })(opts))
  resdir(ripple, dir)
  browsers = browsers
    .map(canonical(farm))
    .filter(Boolean)

  // define data resources
  ripple('results', {}, { from })
  ripple('totals' , {})

  // watch files
  if (!isCI && watch) {
    log('watching', watch)

    chokidar.watch(watch, {
      ignored: [/^\.(.*)[^\/\\]/, /[\/\\]\./, /node_modules(.+)popper/]
    , ignoreInitial: true
    , usePolling: false
    , depth: 5
    })
    .on('change', debounce(generate))
  }

  // icons
  ripple(require('browser-icons'))

  // limit dashboard resources
  ripple.to = limit(ripple.to)
  
  // proxy errors and register agent details
  ripple.server.on('connected', connected)

  // serve assets
  ripple.server.express
    .use(compression())
    .use('/utilise.min.js', send(local('utilise', 'utilise.min.js')))
    .use('/utilise.js'    , send(local('utilise', 'utilise.js')))
    .use('/mocha.css'     , send(local('mocha', 'mocha.css')))
    .use('/mocha.js'      , send(local('mocha', 'mocha.js')))
    .use('/chai.js'       , send(local('chai', 'chai.js')))
    .use('/dashboard/:id' , send(local(`./client/${runner}/logs.html`)))
    .use('/dashboard'     , send(local('./client/dashboard.html')))
    .use('/'              , serve(local('./client')))
    .use('/'              , index())

  return generate()
       , spawn()
       , ripple

  function index(){
    const head = is.arr(globals) ? globals.join('\n') : globals
        , html = file(local(`./client/${runner}/index.html`))
            .replace('<!-- { extra scripts } -->', head || '')

    return (req, res) => res.send(html)
  }

  function generate() {
    log('generating tests')

    const bundle = write(local('./client/tests.js'))
        , stream = is.fn(tests) 
            ? tests()
            : run('sh', ['-c', tests], { stdio: 'pipe' })

    if (stream.stderr) 
      stream.stderr.pipe(process.stderr)

    ;((stream.stdout || stream)
      .on('end', debounce(500)(reload))
      .pipe(bundle)
      .flow || noop)()
  }

  function from(req){
    return req.data.type == 'RERUN'  ? reload(req.data.value)
         : req.data.type == 'SAVE'   ? save(req.socket.platform, req.data.value)
                                     : false
  }

  function save(platform, result) {
    const { uid } = platform
        , results = ripple('results')
        , retries = uid in results ? results[uid].retries : 0

    log('received result from', uid)
    result.platform = platform
    result.retries = retries
    update(uid, result)(ripple('results'))
    totals()
    ci(result)
  }

  function ci(r) {
    if (!isCI || r.stats.running) return

    const browser = browsers
      .filter(d => {
        if (d._name       && d._name       !== r.platform.name)        return false
        if (d._version    && d._version    !== r.platform.version)     return false
        if (d._os         && d._os         !== r.platform.os.name)     return false
        if (d._os_version && d._os_version !== r.platform.os.version)  return false
        return true
      })
      .pop()

    if (!browser) return log('result not in matrix'.red, r.platform.uid)

    browser.passed_by = r.platform.uid
    browser.passed    = !r.stats.failures
    browser.passed
      ? log('browser passed:', r.platform.uid.green.bold)
      : err('browser failed:', r.platform.uid.red.bold)

    if (!browser.passed && r.retries < maxRetries) 
      return log('retrying'.yellow, r.platform.uid, ++r.retries, '/', str(maxRetries).grey) 
           , reload(r.platform.uid)

    if (farms[farm].status)
      farms[farm].status(browser, r.platform)

    const target   = browsers.length
        , passed   = browsers.filter(by('passed')).length
        , finished = browsers.filter(by('passed_by')).length

    log('ci targets', str(passed).green.bold, '/', str(target).grey)
    
      target === passed   ? time(3000, d => process.exit(0))
    : target === finished ? time(3000, d => (!env.POPPER_TIMEOUT && process.exit(1)))
                          : wait()
  }

  function connected(socket){
    socket.platform = parse(socket)
    socket.type = socket.handshake.url == '/dashboard' ? 'dashboard' : 'agent'
    log('connected', socket.platform.uid.green, socket.type.grey)

    socket.on('global err', (message, url, linenumber) => err('Global error: ', socket.platform.uid.bold, message, url, linenumber))

    if (debug) 
      socket.on('console', function(){ log(socket.platform.uid.bold, 'says:', '', arguments[0], to.arr(arguments[1]).map(str).join(' ')) })
  }

  function quit(){
    log('no updates received for', timeout/1000, 'seconds. timing out..')
    process.exit(1)
  }

  function reload(uid) { 
    const uids = uid ? [uid] : ripple.server.ws.sockets.map(d => d.platform.uid)
    
    uids
      .map(uid => update(`${uid}.stats.running`, true)(ripple('results')))

    const agents = ripple.server.ws.sockets
      .filter(not(by('handshake.url', '/dashboard')))
      .filter(by('platform.uid', is.in(uids)))
      .map(emitReload)
      .length 

    log('reloading', str(agents).cyan, 'agents', uid || '')
  }

  function totals() {
    const res = values(ripple('results'))
    return ripple('totals', { 
      tests: str(res.map(key('stats.tests')).filter(Boolean).pop() || '?')
    , browsers: str(res.length)
    , passing: str(res.map(key('stats.failures')).filter(is(0)).length || '0')
    })
  }

  function spawn(){
    ripple.server.once('listening').then(() => {
      log('running on port', ripple.server.http.address().port)
      !notunnel && require('ngrok').connect(ripple.server.http.address().port, (e, url) => {
        log('tunnelling', url && url.magenta)
        return e ? err('error setting up reverse tunnel', e.stack)
                 : browsers.map(boot(farm)(url))
      })
    })
  }

}

const { values, key, str, not, by, grep, lo, is, debounce, extend, falsy, send, file, noop, update, identity, time, includes } = require('utilise/pure')
    , write = require('fs').createWriteStream
    , run = require('child_process').spawn
    , { stringify } = require('cryonic')
    , { resolve } = require('path')
    , compression = require('compression')
    , browserify = require('browserify')
    , platform = require('platform')
    , chokidar = require('chokidar')
    , express = require('express')
    , resdir = require('rijs.resdir')
    , serve = require('serve-static')
    , farms = require('./farms')
    , wd = require('wd')
    , rijs = opts => require('rijs.npm')(require('rijs')(opts))

const log = require('utilise/log')('[popper]')
    , err = require('utilise/err')('[popper]')
    , old = grep(console, 'log', /^(?!.*\[ri\/)/)
    , env = process.env
    , dir = __dirname
    , isCI  = env.CI === 'true'
    , debug  = lo(env.NODE_ENV) == 'debug'

const heartbeat = vm => setInterval(d => vm.eval('', e => { if (e) console.error(e) }), 30000)

const canonical = farm => browser => is.str(browser) 
  ? farms[farm].browsers[browser]
  : browser

const local = (module, file) => {
  const base = !file ? __dirname : require.resolve(module) 
      , read = !file ? module : '../'+file
  return resolve(base, read)
}

const emitReload = socket => socket.send(stringify({ data: { exec: () => location.reload() }}))

const parse = socket => {
  const ua = socket.handshake.headers['user-agent']
      , p = platform.parse(ua)
      , o = { 
          name: lo(p.name)
        , version: major(p.version)
        , os: { 
            name: lo(p.os.family.split(' ').shift())
          , version: major(p.os.version, p.os.family)
          }
        }

  if (o.os.name == 'os') o.os.name = 'osx'
  if (o.name == 'chrome mobile') o.name = 'chrome'
  if (o.name == 'microsoft edge') o.name = 'ie'

  const uid = o.name
      + '-' + o.version
      + '-' + o.os.name
      + '-' + o.os.version

  o.uid = uid

  return o
}

const major = (v, f) => 
    v                     ? v.split('.').shift() 
  : includes('xp')(lo(f)) ? 'xp'
                          : '?'

const limit = next => (req, socket) => {
  return socket.handshake.url == '/dashboard' ? next(req, socket) : false
}

const boot = farm => url => opts => {
  const { _name = '?', _version = '?', _os = '?' } = opts
      , { connect, parse = identity } = farms[farm]
      , id = `${_name.cyan} ${_version.cyan} on ${_os}`
      , vm = opts.vm = connect(wd)

  if (!vm) err('failed to connect to ' + farm), process.exit(1)

  log(`booting up ${id}`)
  
  vm.init(parse(opts), e => {
    if (e) return err(e, id)
    log('initialised', id)
    vm.get(url, e => {
      if (e) return err(e, id)
      log('opened to test page', id.cyan)
      heartbeat(vm)
    })
  })
}