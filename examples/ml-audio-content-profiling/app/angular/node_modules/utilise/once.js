'use strict'

var emitterify = require('./emitterify')  
  , keys = require('./keys')
  , key = require('./key')
  , deep = key
  , rsplit = /([^\.\[]*)/

module.exports = once

function once(nodes, enter, exit) {
  var n = c.nodes = Array === nodes.constructor ? nodes
        : 'string' === typeof nodes ? document.querySelectorAll(nodes)
        : [nodes]

  var p = n.length
  while (p-- > 0) if (!n[p].on) event(n[p], p)

  c.node  = function() { return n[0] }
  c.enter = function() { return once(enter) }
  c.exit  = function() { return once(exit) }
  c.size  = function() { return n.length }

  c.text  = function(value){ 
    var fn = 'function' === typeof value
    return arguments.length === 0 ? n[0].textContent : (this.each(function(n, d, i){
      var r = '' + (fn ? value.call(this, d, i) : value), t
      if (this.textContent !== r) 
        !(t = this.firstChild) ? this.appendChild(document.createTextNode(r))
        : t.nodeName === '#text' ? t.nodeValue = r
        : this.textContent = r
    }), this)
  }
  c.html = function(value){
    var fn = 'function' === typeof value
    return arguments.length === 0 ? n[0].innerHTML : (this.each(function(n, d, i){
      var r = '' + (fn ? value.call(this, d, i) : value), t
      if (this.innerHTML !== r) this.innerHTML = r
    }), this)
  }
  c.attr = function(key, value){
    var fn = 'function' === typeof value
    return arguments.length === 1 ? n[0].getAttribute(key) : (this.each(function(n, d, i){
      var r = fn ? value.call(this, d, i) : value
           if (!r && this.hasAttribute(key)) this.removeAttribute(key)
      else if ( r && this.getAttribute(key) !== r) this.setAttribute(key, r)
    }), this) 
  }
  c.classed = function(key, value){
    var fn = 'function' === typeof value
    return arguments.length === 1 ? n[0].classList.contains(key) : (this.each(function(n, d, i){
      var r = fn ? value.call(this, d, i) : value
           if ( r && !this.classList.contains(key)) this.classList.add(key)
      else if (!r &&  this.classList.contains(key)) this.classList.remove(key)
    }), this) 
  }
  c.property = function(key, value){
    var fn = 'function' === typeof value
    return arguments.length === 1 ? deep(key)(n[0]) : (this.each(function(n, d, i){
      var r = fn ? value.call(this, d, i) : value
      if (r !== undefined && deep(key)(this) !== r) deep(key, function(){ return r })(this)
    }), this) 
  }
  c.each = function(fn){
    p = -1; while(n[++p])
      fn.call(n[p], n[p], n[p].state, p)
    return this
  }
  c.remove = function(){
    this.each(function(){
      var el = this.host && this.host.nodeName ? this.host : this
      el.parentNode.removeChild(el)
    }) 
    return this
  }  
  c.closest = function(tag){ 
    return once(n
      .map(function(d){ return d.closest(tag) })
      .filter(Boolean))
  }
  c.draw = proxy('draw', c)
  c.once = proxy('once', c)
  c.emit = proxy('emit', c)
  c.on   = proxy('on', c)

  return c
  
  function c(s, d, k, b) {
    var selector
      , data
      , tnodes = []
      , tenter = []
      , texit  = []
      , j = -1
      , p = -1
      , l = -1
      , t = -1

    // reselect
    if (arguments.length === 1) {
      if ('string' !== typeof s) return once(s)

      while (n[++p]) 
        tnodes = tnodes.concat(Array.prototype.slice.call(n[p].querySelectorAll(s), 0))

      return once(tnodes)
    }

    // shortcut
    if (d === 1 && arguments.length == 2) {
      while (n[++p]) { 
        j = n[p].children.length
        selector = s.call ? s(n[p].state || 1, 0) : s
        while (n[p].children[--j])  {
          if (n[p].children[j].matches(selector)) {
            (tnodes[++t] = n[p].children[j]).state = n[p].state || 1
            break
          }
        }

        if (j < 0) n[p].appendChild(tnodes[++t] = tenter[tenter.length] = create(selector, [n[p].state || 1], 0))
        if ('function' === typeof tnodes[t].draw) tnodes[t].draw()
      }

      return once(tnodes, tenter, texit)
    }

    // main loop
    while (n[++p]) {
      selector = 'function' === typeof s ? s(n[p].state) : s
      data     = 'function' === typeof d ? d(n[p].state) : d
      
      if (d === 1)                    data = n[p].state || [1]
      if ('string' === typeof data)   data = [data]
      if (!data)                      data = []
      if (data.constructor !== Array) data = [data]
      
      if (k) {
        byKey(selector, data, k, b, n[p], tnodes, tenter, texit)
        continue
      }

      l = -1
      j = -1

      while (n[p].children[++j]) { 
        if (!n[p].children[j].matches(selector)) continue
        if (++l >= data.length) { // exit
          n[p].removeChild(texit[texit.length] = n[p].children[j]), --j
          continue 
        }

        (tnodes[++t] = n[p].children[j]).state = data[l] // update
        if ('function' === typeof n[p].children[j].draw) n[p].children[j].draw()
      }

      // enter
      if (typeof selector === 'string') { 
        n[p].templates = n[p].templates || {}
        n[p].templates[selector] = n[p].templates[selector] || create(selector, [], 0)
        while (++l < data.length) { 
          (b ? n[p].insertBefore(tnodes[++t] = tenter[tenter.length] = n[p].templates[selector].cloneNode(false), n[p].querySelector(b)) 
             : n[p].appendChild( tnodes[++t] = tenter[tenter.length] = n[p].templates[selector].cloneNode(false)))
             .state = data[l]
          if ('function' === typeof tnodes[t].draw) tnodes[t].draw()
        }
      } else {
        while (++l < data.length) { 
          (b ? n[p].insertBefore(tnodes[++t] = tenter[tenter.length] = create(selector, data, l), n[p].querySelector(b)) 
             : n[p].appendChild( tnodes[++t] = tenter[tenter.length] = create(selector, data, l)))
          if ('function' === typeof tnodes[t].draw) tnodes[t].draw()
        }
      }
    }
  
    return once(tnodes, tenter, texit)
  }

}

// TODO: factor out - need to fix nbuild / non-./deps
function event(node) {
  // node = node.host && node.host.nodeName ? node.host : node
  if (node.on) return
  node.listeners = {}

  const on = o => {
    const type = o.type.split('.').shift()
    if (!node.listeners[type])
      node.addEventListener(type, node.listeners[type] = 
        event => (!event.detail || !event.detail.emitted ? emit(type, [event, node.state, node]) : 0)
      )
  }

  const off = o => {
    if (!node.on[o.type].length) {
      node.removeEventListener(o.type, node.listeners[o.type])
      delete node.listeners[o.type]
    }
  }

  emitterify(node, { on, off })
  const { emit } = node

  node.emit = function(type, params){
    const detail = { params, emitted: true }
        , event = new CustomEvent(type, { detail, bubbles: false, cancelable: true })
    node.dispatchEvent(event)
    return emit(type, event)
  }
}

function proxy(fn, c) {
  return function(){
    var args = arguments
    c.each(function(){
      var node = this.host && this.host.nodeName ? this.host : this
      node[fn] && node[fn].apply(node, args)
    }) 
    return c 
  }
}

function create(s, d, j) {
  var i     = 0
    , attrs = []
    , css   = []
    , sel   = s.call ? s(d[j], j) : s
    , tag   = rsplit.exec(sel)[1] || 'div'
    , node  = document.createElement(tag)

  ;(s.call ? s.toString() : s)
    .replace(/\[(.+?)="(.*?)"\]/g, function($1, $2, $3){ return attrs[attrs.length] = [$2, $3], '' })
    .replace(/\.([^.]+)/g, function($1, $2){ return css[css.length] = $2, ''})

  for (i = 0; i < attrs.length; i++) 
    node.setAttribute(attrs[i][0], attrs[i][1])

  for (i = 0; i < css.length; i++) 
    node.classList.add(css[i])

  node.state = d[j] || 1
  return node
}

function byKey(selector, data, key, b, parent, tnodes, tenter, texit) {
  var c = -1
    , d = data.length
    , k
    , indexNodes = {}
    , child
    , next

  while (parent.children[++c]) 
    if (!parent.children[c].matches(selector)) continue
    else indexNodes[key(parent.children[c].state)] = parent.children[c]

  next = b ? parent.querySelector(b) : null

  while (d--) {
    if (child = indexNodes[k = key(data[d])])
      if (child === true) continue
      else child.state = data[d]
    else
      tenter.unshift(child = create(selector, data, d))
    
    indexNodes[k] = true

    if (d == data.length - 1 || next !== child.nextSibling)
      parent.insertBefore(child, next)

    tnodes.unshift(next = child)
    if ('function' === typeof child.draw) child.draw()
  }

  for (c in indexNodes)
    if (indexNodes[c] !== true)
      texit.unshift(parent.removeChild(indexNodes[c]))
}