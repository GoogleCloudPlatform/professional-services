(async () => {
  const puppeteer = require('puppeteer')
      , browser = await puppeteer.launch({ headless: process.env.HEADLESS !== 'false' })
      , { emitterify, file, keys, delay, za } = require('utilise/pure')
      , { stringify } = require('cryonic')
      , { Readable } = require('stream')
      , { test } = require('tap')
   
  await test('respond via return', async ({ plan, same }) => {
    plan(5)
    const { server, page } = await startup(req => 'ack')
    
    same(1, server.ws.sockets.length, 'socket added')
    same('ack', await page.evaluate(() => xclient.send('create')), 'response')
    same(1, await page.evaluate(() => xclient.subscriptions.length), 'subscription destroyed (client)') // TODO: This should be 0 - force unsubscribe
    same(0, keys(server.ws.sockets[0].subscriptions).length, 'subscription cleared (server)')

    await page.close()
    await Promise.race([delay(100), server.once('disconnected')])
    same(server.ws.sockets.length, 0, 'socket removed')
  })

  await test('respond via function', async ({ plan, same }) => {
    plan(3)
    const { server, page } = await startup((req, res) => { res('foo'), res('bar') })
    
    same(['foo', 'bar'], await page.evaluate(() => (collect(2, $ = xclient.send('create')))), 'response')
    await page.evaluate(() => Promise.all($.source.emit('stop')))
    same(0, keys(server.ws.sockets[0].subscriptions).length, 'subscription cleared (server)')
    same(0, await page.evaluate(() => xclient.subscriptions.length), 'subscription destroyed (client)')
    page.close()
  })

  await test('respond via stream', async ({ plan, same }) => {
    plan(3)
    const { server, page } = await startup(req => req.on('data').map(d => d * 2))
    
    same([2, 4], await page.evaluate(() => {
      const input = emitterify().on('foo').on('start', () => {
        input.next(1)
        input.next(2)
      })
      return collect(2, $ = xclient.send(input))
    }), 'response')
    await page.evaluate(() => Promise.all($.source.emit('stop')))
    same(0, keys(server.ws.sockets[0].subscriptions).length, 'subscription cleared (server)')
    same(0, await page.evaluate(() => xclient.subscriptions.length), 'subscription destroyed (client)')
    page.close()
  })

  await test('respond to binary', { timeout: 9999 }, async ({ plan, same, ok }) => {
    plan(6)
    const { server, page } = await startup(req => { 
      same(req.data.meta, { foo: 'bar' })
      ok(req.binary instanceof Readable)
      same(req.chunks.join('').length, 2000)    
      return 'ack'
    })

    const results = [
      { type: 'sent'    , value: { id: '1' } }
    , { type: 'progress', value: { received: 1024, total: 2000 } }
    , { type: 'progress', value: { received: 2000, total: 2000 } }
    , { type: 'complete', value: 'ack' }
    ]
    
    same((await page.evaluate(() => {
      const binary = new Blob([Array(2000).fill(1).join('')])
          , results = []

      return $ = xclient.send(binary, { foo: 'bar' })
        .on('sent', d => results.push({ type: 'sent', value: d }))
        .on('progress', d => results.push({ type: 'progress', value: d }))
        .map(d => results.push({ type: 'complete', value: d }))
        .filter(d => results.length === 4)
        .map(d => results)
    })).sort(za('type')), results, 'response')

    await page.evaluate(() => Promise.all($.source.emit('stop')))
    same(0, keys(server.ws.sockets[0].subscriptions).length, 'subscription cleared (server)')
    same(0, await page.evaluate(() => xclient.subscriptions.length), 'subscription destroyed (client)')
    page.close()
  })

  await test('should continue subscriptions over reconnection', async ({ plan, same }) => {
    plan(1)
    const { server, page } = await startup({ processor: d => 'ack1', port: 7000 })
        
    await page.evaluate(() => {
      raw = xclient.send('something')
      all = raw.reduce((acc = [], d) => acc.concat(d)).filter(d => d.length == 2)
      return raw
    })

    // close first server, start another one
    server.http.close()
    server.ws.close()
    const server2 = (await startup({ processor: d => 'ack2', port: 7000 }, 0)).server

    same(['ack1', 'ack2'], await page.evaluate(() => all), 'all responses')
    
    page.close()
  })

  await test('should allow response without request', async ({ plan, same }) => {
    plan(1)
    const exec = (o, d) => { $.next(typeof o === 'undefined' && d === 42) }
        , { server, page } = await startup()
        
    await page.evaluate(() => {
      $ = emitterify().once('foo')
      result = $.filter(result => result === true)
    })

    server.ws.sockets.map(socket => socket.send('{"data":{"exec":(o, v) => { $.next(typeof o == \'undefined\' && v === 42) },"value":42 }}'))
    same(await page.evaluate(() => result), true)

    page.close()
  })

  await test('server-side push/subscribe', async ({ plan, same }) => {
    plan(2)
    const { server, page } = await startup(req => 'ack')
    
    await page.evaluate(() => { $ = xclient.once('recv') })
    server.recv(server.ws.sockets[0], { detail: 'FOO' })
    same('ack', await page.evaluate(() => $))

    // TODO: for both client/server initatied, this should be 0 for single value, and 1 for streams
    // same(0, await page.evaluate(() => xclient.subscriptions.length), 'subscription created (client)')
    // same(1, keys(server.ws.sockets[0].subscriptions).length, 'subscription created (server)')

    await page.close()
    await Promise.race([delay(100), server.once('disconnected')])
    same(server.ws.sockets.length, 0, 'socket removed')
  })

  process.exit(0)

  async function startup(opts, pages = 1){
    const server = await require('./server')(opts).once('listening')

    server.express.use((req, res) => res.send(`
      <script>${file(require.resolve('utilise.emitterify/client'))}</script>
      <script>${file('./client.bundle.js')}</script>
      <script>
        collect = (count, stream) => stream
          .reduce((acc = [], d) => (acc.push(d), acc))
          .filter(d => d.length === count)
        xclient = xrs()
      </script>
    `))


    pages = await Promise.all(Array(pages).fill().map(async (d, i) => {
      const page = await browser.newPage()
      if (process.env.DEBUG == 'true')
        page.on('console', (...args) => console.log(`(CLIENT ${i}):`, ...args))
      await page.goto(`http://localhost:${server.port}`)
      return page
    }))
    return { server, pages, page: pages[0] }
  }
})()
