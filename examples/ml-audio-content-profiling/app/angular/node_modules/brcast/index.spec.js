import brcast from './index'

test('default export is a function', () => {
  expect(typeof brcast).toBe('function')
})

test('exposes the public API', () => {
  const broadcast = brcast()
  const methods = Object.keys(broadcast)

  expect(methods.length).toBe(4)
  expect(methods).toContain('subscribe')
  expect(methods).toContain('unsubscribe')
  expect(methods).toContain('getState')
  expect(methods).toContain('setState')
})

test('throws if listener is not a function', () => {
  const broadcast = brcast()
  expect(() => broadcast.subscribe()).toThrow()
  expect(() => broadcast.subscribe('throw')).toThrow()
  expect(() => broadcast.subscribe({})).toThrow()
  expect(() => broadcast.subscribe(() => {})).not.toThrow()
})

test('is able to start with an undefined state and update it accordingly', () => {
  const broadcast = brcast()
  expect(broadcast.getState()).toBeUndefined()
  broadcast.setState(2)
  expect(broadcast.getState()).toBe(2)
})

test('it updates the state', () => {
  const handler = jest.fn()
  const broadcast = brcast()
  broadcast.subscribe(handler)
  broadcast.setState(2)
  expect(handler.mock.calls.length).toBe(1)
  expect(handler.mock.calls[0][0]).toBe(2)
})

test('it unsubscribes only relevant listeners', () => {
  const handler = jest.fn()
  const handler1 = jest.fn()
  const broadcast = brcast(1)
  const subscriptionId = broadcast.subscribe(handler)
  broadcast.subscribe(handler1)
  broadcast.unsubscribe(subscriptionId)
  broadcast.setState(2)
  broadcast.setState(3)
  expect(handler.mock.calls.length).toBe(0)
  expect(handler1.mock.calls.length).toBe(2)
})

test('removes listeners only once when unsubscribing more than once', () => {
  const handler = jest.fn()
  const broadcast = brcast(1)
  const subscriptionId = broadcast.subscribe(handler)

  broadcast.unsubscribe(subscriptionId)
  broadcast.unsubscribe(subscriptionId)
  broadcast.setState(2)
  expect(handler.mock.calls.length).toBe(0)
})

test('supports removing a subscription within a subscription', () => {
  const broadcast = brcast(1)
  const handler = jest.fn()
  const handler1 = jest.fn()
  const handler2 = jest.fn()

  broadcast.subscribe(handler)
  const sub1Id = broadcast.subscribe(() => {
    handler1()
    broadcast.unsubscribe(sub1Id)
  })
  broadcast.subscribe(handler2)

  broadcast.setState(2)
  broadcast.setState(3)
  expect(handler.mock.calls.length).toBe(2)
  expect(handler1.mock.calls.length).toBe(1)
  expect(handler2.mock.calls.length).toBe(2)
})

test('do not notify subscribers getting unsubscribed in the middle of a setState', () => {
  const broadcast = brcast()

  const unsubscribeIds = []
  const doUnsubscribeAll = () =>
    unsubscribeIds.forEach(id => broadcast.unsubscribe(id))

  const handler = jest.fn()
  const handler1 = jest.fn()
  const handler2 = jest.fn()

  unsubscribeIds.push(broadcast.subscribe(handler))
  unsubscribeIds.push(
    broadcast.subscribe(() => {
      handler1()
      doUnsubscribeAll()
    })
  )
  unsubscribeIds.push(broadcast.subscribe(handler2))

  broadcast.setState(2)
  expect(handler.mock.calls.length).toBe(1)
  expect(handler1.mock.calls.length).toBe(1)
  expect(handler2.mock.calls.length).toBe(0)

  broadcast.setState(3)
  expect(handler.mock.calls.length).toBe(1)
  expect(handler1.mock.calls.length).toBe(1)
  expect(handler2.mock.calls.length).toBe(0)
})
