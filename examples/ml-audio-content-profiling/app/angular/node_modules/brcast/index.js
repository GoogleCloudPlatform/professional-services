export default function createBroadcast (initialState) {
  let listeners = {}
  let id = 1
  let _state = initialState

  function getState () {
    return _state
  }

  function setState (state) {
    _state = state
    const keys = Object.keys(listeners)
    let i = 0
    const len = keys.length
    for (; i < len; i++) {
      // if a listener gets unsubscribed during setState we just skip it
      if (listeners[keys[i]]) listeners[keys[i]](state)
    }
  }

  // subscribe to changes and return the subscriptionId
  function subscribe (listener) {
    if (typeof listener !== 'function') {
      throw new Error('listener must be a function.')
    }
    const currentId = id
    listeners[currentId] = listener
    id += 1
    return currentId
  }

  // remove subscription by removing the listener function
  function unsubscribe (id) {
    listeners[id] = undefined
  }

  return { getState, setState, subscribe, unsubscribe }
}
