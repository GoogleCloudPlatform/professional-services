const { test } = require('tap')
    , xserver = require('./server')
    , { str, emitterify, delay } = require('utilise/pure')
    , { Readable } = require('stream')

test('should reply via return value', ({ plan, same, notOk }) => {
  plan(2)
  const { express, http, ws } = dependencies()

  const server = xserver(req => 'bar', { express, http, ws })
      , socket = ws.connect()

  socket.emit('message', str({ id: '1', data: 'foo' }))
  notOk('1' in socket.subscriptions)

  same(socket.sent, [
    str({ id: '1', data: 'bar' })
  ])
})

test('should reply via promise', async ({ plan, same, ok, notOk }) => {
  plan(3)
  const { express, http, ws } = dependencies()

  const server = xserver(async req => 'bar', { express, http, ws })
      , socket = ws.connect()

  socket.emit('message', str({ id: '1', data: 'foo' }))
  ok('1' in socket.subscriptions)

  await Promise.resolve() 
  notOk('1' in socket.subscriptions)

  same(socket.sent, [
    str({ id: '1', data: 'bar' })
  ])
})

test('should reply via res function', ({ plan, same }) => {
  plan(1)
  const { express, http, ws } = dependencies()

  const server = xserver((req, res) => { res('bar'); res('baz') }, { express, http, ws })
      , socket = ws.connect()

  socket.emit('message', str({ id: '1', data: 'foo' }))
  same(socket.sent, [
    str({ id: '1', data: 'bar' })
  , str({ id: '1', data: 'baz' })
  ])
})

test('should reply via stream (and manage unsubscription)', async ({ plan, same, ok, notOk }) => {
  plan(3)
  const { express, http, ws } = dependencies()
      , output = emitterify().on('')

  const server = xserver(req => output, { express, http, ws })
      , socket = ws.connect()

  socket.emit('message', str({ id: '1', data: 'foo' }))
  ok('1' in socket.subscriptions)
  output.next('bar')
  output.next('baz')
  
  socket.emit('message', str({ id: '2',  type: 'UNSUBSCRIBE', data: '1' }))
  notOk('1' in socket.subscriptions)
  output.next('boo')
  output.next('bee')

  same(socket.sent, [
    str({ id: '1', data: 'bar' })
  , str({ id: '1', data: 'baz' })
  , str({ id: '2', data: 'uack' })
  ])
})

test('should reply to stream (and manage unsubscription)', async ({ plan, same, ok, notOk }) => {
  plan(3)
  const { express, http, ws } = dependencies()
      
  const server = xserver(req => req.on('data').map(d => d * 2), { express, http, ws })
      , socket = ws.connect()

  socket.emit('message', str({ id: '1', data: 1 }))
  ok('1' in socket.subscriptions)
  socket.emit('message', str({ id: '1', data: 2 }))
  socket.emit('message', str({ id: '1', data: 3 }))

  socket.emit('message', str({ id: '2',  type: 'UNSUBSCRIBE', data: '1' }))
  notOk('1' in socket.subscriptions)

  same(socket.sent, [
    str({ id: '1', data: 2 })
  , str({ id: '1', data: 4 })
  , str({ id: '1', data: 6 })
  , str({ id: '2', data: 'uack' })
  ])
})

// test('should provide a managed list of active sockets', async ({ plan, same, ok, notOk }) => {
//   plan(2)
//   const { express, http, ws } = dependencies()
      
//   const server = xserver(req => req.on('data').map(d => d * 2), { express, http, ws })
//       , socket = ws.connect()

//   same(ws.sockets, [socket])
//   socket.emit('close')
//   same(ws.sockets, [])
// })

test('should receive binary', async ({ plan, same, ok, notOk }) => {
  plan(4)
  const { express, http, ws } = dependencies()
      , processor = req => {
          ok(req.binary instanceof Readable)
          same(req.data.meta, 'meta')
          return 'back'
        }

  const server = xserver(processor, { express, http, ws })
      , socket = ws.connect()

  socket.emit('message', str({ id: '1', type: 'BINARY', data: { size: 6, meta: 'meta' }}))
  ok('1' in socket.subscriptions)
  socket.emit('message', new ArrayBuffer(4))
  socket.emit('message', new ArrayBuffer(2))

  await delay()

  // TODO: add req.end()?
  // notOk('1' in socket.subscriptions)
  
  same(socket.sent, [
    '{"id":"1","data":{"exec":(o, v) => o.emit(\'progress\', v),"value":4}}'
  , '{"id":"1","data":{"exec":(o, v) => o.emit(\'progress\', v),"value":6}}'
  , '{"id":"1","data":"back"}'
  ])
})

function dependencies(){
  const http = { listen: d => d }
      , express = {}
      , ws = emitterify({})

  ws.connect = (_socket = { remoteAddress: 'addr', remotePort: 'port' }) => {
    const socket = emitterify({ _socket })
    ws.emit('connection', socket)
    socket.sent = []
    socket.send = buffer => socket.sent.push(buffer)
    return socket
  }

  return { express, http, ws }
}