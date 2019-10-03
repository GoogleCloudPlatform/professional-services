const { test } = require('tap')
    , { str, emitterify, extend, delay, values } = require('utilise/pure')
    , { stringify } = JSON
    , nanosocket = require('nanosocket/fake')
    , xclient = require('./client')
    , { Blob, fakeTimeout } = require('global-mocks')
    , window = global.window = { Blob, setTimeout: fakeTimeout }
    , collect = (stream, count) => stream
        .reduce((acc = [], d) => (acc.push(d), acc))
        .filter(d => d.length === count)
    
test('should send request and unsubscribe', async ({ plan, same }) => {
  plan(8)
  const socket = nanosocket()
      , xrs = xclient({ socket })
      , output = xrs.send({ name: 'trades', type: 'ACTIVE', top: 10 })

  // request sent
  same(xrs.subscriptions.length, 1, 'subscription created')
  const { id, count } = await output.once('sent')
  same(id, 1, 'increment subscription number')
  same(count, 0, 'updates on that subscription')

  // await replies
  const replies = collect(output, 3)

  // send replies
  socket.emit('recv', stringify({ id: '10', data: { type: 'fail' }}))
  socket.emit('recv', stringify({ id, data: { type: 'update', value: {}}}))
  socket.emit('recv', stringify({ id, data: { type: 'update', value: { price: 10 }, key: 'foo' }}))
  socket.emit('recv', stringify({ id, data: { type: 'update', value: { price: 20 }, key: 'bar' }}))

  // unsubscribe
  const unsubscribe = output.source.emit('stop').pop()
  same(xrs.subscriptions.length, 1, 'subscription destroyed, waiting for unsubscribe response')
  socket.emit('recv', stringify({ id: '2', data: 'uack' }))
  same(await unsubscribe, 'uack', 'unsubscribe ack')
  same(xrs.subscriptions.length, 0, 'subscriptions all destroyed')
  
  same(await replies, [
    { type: 'update', value: {} }
  , { type: 'update', value: { price: 10 }, key: 'foo' }
  , { type: 'update', value: { price: 20 }, key: 'bar' }
  ], 'replies')
  
  same(socket.sent, [
    str({ id: '1', data: { name: 'trades', type: 'ACTIVE', top: 10 }})
  , str({ id: '2', data: '1', type: 'UNSUBSCRIBE' })
  ])
})

test('should send stream, change and unsubscribe', async ({ plan, same }) => {
  plan(6)
  const socket = nanosocket()
      , xrs = xclient({ socket })
      , input = emitterify().on('change')
      , output = xrs.send(input)

  // request sent
  same(xrs.subscriptions.length, 1, 'subscription created')
  const sent = collect(output.on('sent'), 2)

  input.next({ name: 'trades', type: 'ACTIVE', top: 10 })
  input.next({ name: 'trades', type: 'ACTIVE', top: 20 })

  // unsubscribe
  const unsubscribe = output.source.emit('stop').pop()
  same(xrs.subscriptions.length, 1, 'subscription destroyed, waiting for unsubscribe response')
  socket.emit('recv', stringify({ id: '2', data: 'uack' }))
  same(await unsubscribe, 'uack', 'unsubscribe ack')
  same(xrs.subscriptions.length, 0, 'subscription destroyed')

  same(await sent, [
    { id: 1, count: 0 }
  , { id: 1, count: 1 }
  ], 'messages sent')
  
  same(socket.sent, [
    str({ id: '1', data: { name: 'trades', type: 'ACTIVE', top: 10 }})
  , str({ id: '1', data: { name: 'trades', type: 'ACTIVE', top: 20 }})
  , str({ id: '2', data: '1', type: 'UNSUBSCRIBE' })
  ])
})

test('should evaluate exec responses', async ({ plan, same }) => {
  plan(1)
  const socket = nanosocket()
      , { send } = xclient({ socket })
      , output = send({})

  socket.emit('recv', '{"id":"1","data":{"exec":(o, v) => o.next(v*2),"value":2}}')
  same(await output, 4, 'reply')
})

test('should send binaries', async ({ plan, same }) => {
  plan(4)
  const socket = nanosocket()
      , { send } = xclient({ socket })
      , output = send(new Blob({ size: 2000 }), 'meta')

  await output.once('sent')

  socket.emit('recv', '{"id":"1","data":"back"}')
  output.once('progress', d => same(d, { received: 1024, total: 2000 }), 'progress 1')
  socket.emit('recv', '{"id":"1","data":{"exec":(o, v) => o.emit(\'progress\', v),"value":1024}}')
  output.once('progress', d => same(d, { received: 2000, total: 2000 }), 'progress 2')
  socket.emit('recv', '{"id":"1","data":{"exec":(o, v) => o.emit(\'progress\', v),"value":2000}}')

  same(socket.sent, [
    str({ id: '1', data: { size: 2000, meta: 'meta' }, type: 'BINARY' })
  , { start: 0, end: 1024 }
  , { start: 1024, end: 2000 }
  ])

  same(await output, 'back' )
})

test('should continue subscriptions during reconnect', async ({ plan, same }) => {
  plan(2)

  const socket = nanosocket()
      , { send } = xclient({ socket })
      , output = send('foo')

  const replies = collect(output, 2)

  // reply before reconnect
  socket.emit('recv', stringify({ id: '1', data: 'reply 1' }))
  
  socket.emit('disconnected')
  socket.emit('connected')

  // reply after reconnect
  socket.emit('recv', stringify({ id: '1', data: 'reply 2' }))

  same(await replies, [
    'reply 1'
  , 'reply 2'
  ])

  same(socket.sent, [
    str({ id: '1', data: 'foo' })
  , str({ id: '1', data: 'foo' })
  ])
})

test('should not duplicate resubscriptions during backoff', async ({ plan, same }) => {
  plan(1)

  const socket = nanosocket()
      , { send } = xclient({ socket })
      , output = send('foo')
  
  socket.emit('disconnected')
  socket.emit('disconnected')
  socket.emit('disconnected')
  socket.emit('disconnected')
  socket.emit('connected')

  socket.emit('disconnected')
  socket.emit('disconnected')
  socket.emit('disconnected')
  socket.emit('disconnected')
  socket.emit('connected')

  same(socket.sent, [
    str({ id: '1', data: 'foo' })
  , str({ id: '1', data: 'foo' })
  , str({ id: '1', data: 'foo' })
  ])
})