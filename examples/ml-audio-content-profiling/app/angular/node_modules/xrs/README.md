# Reactive Server

* Allows you to send a [stream](https://github.com/utilise/emitterify/#emitterify) as input, and return a stream 
* You can also return a value, promise or stream
* Client is ~3 kb bundled, built on top of [nanosocket](https://github.com/pemrouz/nanosocket). Server is express + uws.
* Allows uploading binary with progress events

#### Server:

```js
xrs = reqire('xrs')
server = xrs(req => 'ack')
server = xrs(req => Promise.resolve('ack'))
server = xrs(req => stream().on('start', function(){ this.next(1); this.next(2) }))
```

* You can also use the signature `(req, res)` if you don't want to return the value.
* You can access the underlying `uws` , `express` and `http` instance on the `server`.
* For additional options: you pass in `{ port, certs, processor }` instead of just a `processor` function. Otherwise the `port` will be random, and no `certs` will mean you get a HTTP server rather than a HTTPS server.
* The input stream can be accessed via `req.on('data')`
* The `req` has the following properties: `{ id, socket, data, res }` - `data` is what the client sent

#### Client

```js
send = xrs()
send('value')
send(Promise.resolve('value'))
send(node.on('click').until(node.on('removed')))
  .map(...)
  .filter(...)
```

You can similarly send a value, promise or stream. `send` returns a stream of all the server responses. In all cases, you get a `sent`  event on the stream when it's actually sent. When sending binaries you can also associate some metadata, and get a stream of progress events (this is from the end-to-end tests): 

```js
const results = []
await send(binary, { foo: 'bar' })
  .on('sent', d => results.push({ type: 'sent', value: d }))
  .on('progress', d => results.push({ type: 'progress', value: d }))
  .map(d => results.push({ type: 'complete', value: d }))
  .filter(d => results.length === 4)

results === [
  { type: 'sent'    , value: { id: '1' } }
, { type: 'progress', value: { received: 1024, total: 2000 } }
, { type: 'progress', value: { received: 2000, total: 2000 } }
, { type: 'complete', value: 'ack' }
]
```