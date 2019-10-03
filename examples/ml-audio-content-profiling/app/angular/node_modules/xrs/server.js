// reactive server: it takes in a single stream and returns a stream
module.exports = (opts = {}, deps = {}) => {
  opts = is.fn(opts) ? { processor: opts } : opts
  const { certs, port } = opts
      , { express = require('express')()
        , http = certs
          ? require('https').createServer(certs, express)
          : require('http').createServer(express)
        , ws = new (require('uws').Server)({ server: http })
        } = deps
      , server = emitterify({ express, http, ws, recv, opts })

  ws.sockets = []
  ws.on('connection', connected(server))
  http.listen(port, d => {
    log('listening', server.port = http.address().port)
    server.emit('listening', server)
  })

  return server
}

const recv = (socket, data) =>
  message(socket)({ id: `S${++socket.id}`, data }, data)

const connected = server => socket => {
  const { connected = noop } = server.opts
  socket.remoteAddress = socket._socket.remoteAddress
  socket.remotePort = socket._socket.remotePort
  socket.handshake = socket.upgradeReq
  socket.subscriptions = {}
  socket.server = server
  socket.outbox = []
  socket.id = 0
  connected(socket)
  socket.on('message', message(socket))
  socket.on('close', disconnected(server, socket))
  socket.on('error', err)
  server.ws.sockets.push(socket)
  server.emit('connected', socket)
  log('connected'.green, `${socket.remoteAddress} | ${socket.remotePort}`.grey) 
}

const disconnected = (server, socket) => () => {
  log('disconnected'.yellow, `${socket.remoteAddress} | ${socket.remotePort}`.grey) 
  server.ws.sockets.splice(server.ws.sockets.indexOf(socket), 1)
  for (id in socket.subscriptions)
    close(socket, id)
  server.emit('disconnected', socket)
}

const close = ({ subscriptions }, id) => { 
  if (!(id in subscriptions)) 
    return deb('recv UNSUBSCRIBE', 'nuack'.red, `(${id})`.grey), 'nuack'

  deb('recv UNSUBSCRIBE', subscriptions[id].data.name || '', `(${id})`.grey)
  if (subscriptions[id].stream) {
    subscriptions[id].stream.source.emit('stop')
    subscriptions[id].stream.parent.off(subscriptions[id].stream)
  }
  delete subscriptions[id]
  return 'uack'
}

const serialise = (input, refs = []) =>{
  try {
    return typeof input == 'string' 
  ? input 
  : stringify(input, (key, value) =>
      typeof value == 'function' 
        ? `__REF__${refs.push(value)-1}`
        : value
    ).replace(/"__REF__(\d+)"/g, ($1, $2) => refs[$2].toString())
  } catch (e) {
    err(`failed to serialise (${e.message}):`, input)
  }
}

const send = (socket, data) =>
  socket.send(socket.server.opts.serialise 
    ? socket.server.opts.serialise(data, socket, serialise)
    : serialise(data)
  )

const message = socket => buffer => {
  if (buffer instanceof ArrayBuffer) 
    return socket.upload.emit('progress', buffer)

  const { id, data, type } = is.str(buffer) ? parse(buffer) : buffer
      , { processor } = socket.server.opts

  if (id in socket.subscriptions)
    return socket.subscriptions[id].emit('data', data)

  const res = data => send(socket, id[0] == 'S' ? { data } : { id, data })
      , error = e => req.res({ 
          exec: (o, msg) => console.error('(server error)', msg)
        , value: err(e.message, '\n', e.stack)
        })  
      // TODO: check on unsubscribe
      , req = socket.subscriptions[id] = emitterify({ id, error, socket, data, res })

  if (type != 'UNSUBSCRIBE')
    deb('recv', data.type || type || '', data.name || '', `(${id})`.grey)

  try {
    const processed = unwrap(req)(
      type == 'UNSUBSCRIBE' ? close(socket, data)
    : type == 'BINARY'      ? binary(req).map(processor)
                            : processor(req, req.res)
    ) 
    req.emit('data', data)
    return processed
  } catch (e) { req.error(e) } // return new Error?
}

const unwrap = req => reply => 
  !is.def(reply)     ? false
:  is.stream(reply)  ? (req.stream = reply.map(req.res)).start()
:  is.promise(reply) ? reply
                        .then(unwrap(req))
                        .catch(req.error)
                     : (req.res(reply), close(req.socket, req.id))

const binary = req =>
  (req.socket.upload = extend(req)({ chunks: [], size: 0 }))
    .on('progress')
    .map(chunk => {
      req.chunks.push(new Buffer(chunk.slice()))
      req.size += chunk.byteLength
      req.res({ exec: (o, v) => o.emit('progress', v), value: req.size })
    })
    .filter(d => req.size == req.data.size)
    .map(d => {
      req.binary = stream(req.chunks)
      return req
    })

const { emitterify, is, parse, noop, extend } = require('utilise/pure')
    , { stringify } = JSON
    , log = require('utilise/log')('[xrs]')
    , err = require('utilise/err')('[xrs]')
    , deb = require('utilise/deb')('[xrs]')
    , stream = chunks => new require('stream').Readable({
        read(){
          this.push(chunks.length 
            ? new Buffer(new Uint8Array(chunks.shift())) 
            : null
          )
        }
      })
