var xrs = (function () {
'use strict';

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var promise_1 = promise;

function promise() {
  var resolve
    , reject
    , p = new Promise(function(res, rej){ 
        resolve = res, reject = rej;
      });

  arguments.length && resolve(arguments[0]);
  p.resolve = resolve;
  p.reject  = reject;
  return p
}

var flatten = function flatten(p,v){ 
  if (v instanceof Array) v = v.reduce(flatten, []);
  return (p = p || []), p.concat(v) 
};

var has = function has(o, k) {
  return k in o
};

var def = function def(o, p, v, w){
  if (o.host && o.host.nodeName) o = o.host;
  if (p.name) v = p, p = p.name;
  !has(o, p) && Object.defineProperty(o, p, { value: v, writable: w });
  return o[p]
};

var noop = function(){};

var emitterify = function emitterify(body, hooks) {
  body = body || {};
  hooks = hooks || {};
  def(body, 'emit', emit, 1);
  def(body, 'once', once, 1);
  def(body, 'off', off, 1);
  def(body, 'on', on, 1);
  body.on['*'] = body.on['*'] || [];
  return body

  function emit(type, pm, filter) {
    var li = body.on[type.split('.')[0]] || []
      , results = [];

    for (var i = 0; i < li.length; i++)
      if (!li[i].ns || !filter || filter(li[i].ns))
        results.push(call(li[i].isOnce ? li.splice(i--, 1)[0] : li[i], pm));

    for (var i = 0; i < body.on['*'].length; i++)
      results.push(call(body.on['*'][i], [type, pm]));

    return results.reduce(flatten, [])
  }

  function call(cb, pm){
    return cb.next             ? cb.next(pm) 
         : pm instanceof Array ? cb.apply(body, pm) 
                               : cb.call(body, pm) 
  }

  function on(type, opts, isOnce) {
    var id = type.split('.')[0]
      , ns = type.split('.')[1]
      , li = body.on[id] = body.on[id] || []
      , cb = typeof opts == 'function' ? opts : 0;

    return !cb &&  ns ? (cb = body.on[id]['$'+ns]) ? cb : push(observable(body, opts))
         : !cb && !ns ? push(observable(body, opts))
         :  cb &&  ns ? push((remove(li, body.on[id]['$'+ns] || -1), cb))
         :  cb && !ns ? push(cb)
                      : false

    function push(cb){
      cb.isOnce = isOnce;
      cb.type = id;
      if (ns) body.on[id]['$'+(cb.ns = ns)] = cb;
      li.push(cb)
      ;(hooks.on || noop)(cb);
      return cb.next ? cb : body
    }
  }

  function once(type, callback){
    return body.on(type, callback, true)
  }

  function remove(li, cb) {
    var i = li.length;
    while (~--i) 
      if (cb == li[i] || cb == li[i].fn || !cb)
        (hooks.off || noop)(li.splice(i, 1)[0]);
  }

  function off(type, cb) {
    remove((body.on[type] || []), cb);
    if (cb && cb.ns) delete body.on[type]['$'+cb.ns];
    return body
  }

  function observable(parent, opts) {
    opts = opts || {};
    var o = emitterify(opts.base || promise_1());
    o.i = 0;
    o.li = [];
    o.fn = opts.fn;
    o.parent = parent;
    o.source = opts.fn ? o.parent.source : o;
    
    o.on('stop', function(reason){
      o.type
        ? o.parent.off(o.type, o)
        : o.parent.off(o);
      return o.reason = reason
    });

    o.each = function(fn) {
      var n = fn.next ? fn : observable(o, { fn: fn });
      o.li.push(n);
      return n
    };

    o.pipe = function(fn) {
      return fn(o)
    };

    o.map = function(fn){
      return o.each(function(d, i, n){ return n.next(fn(d, i, n)) })
    };

    o.filter = function(fn){
      return o.each(function(d, i, n){ return fn(d, i, n) && n.next(d) })
    };

    o.reduce = function(fn, acc) {
      return o.each(function(d, i, n){ return n.next(acc = fn(acc, d, i, n)) })
    };

    o.unpromise = function(){ 
      var n = observable(o, { base: {}, fn: function(d){ return n.next(d) } });
      o.li.push(n);
      return n
    };

    o.next = function(value) {
      o.resolve && o.resolve(value);
      return o.li.length 
           ? o.li.map(function(n){ return n.fn(value, n.i++, n) })
           : value
    };

    o.until = function(stop){
      (stop.each || stop.then).call(stop, function(reason){ return o.source.emit('stop', reason) });
      return o
    };

    o.off = function(fn){
      return remove(o.li, fn), o
    };

    o.start = function(fn){
      o.source.emit('start');
      return o
    };

    o[Symbol.asyncIterator] = function(){ 
      return { 
        next: function(){ 
          return o.wait = new Promise(function(resolve){
            o.wait = true;
            o.map(function(d, i, n){
              delete o.wait;
              o.off(n);
              resolve({ value: d, done: false });
            });
            o.emit('pull', o);
          })
        }
      }
    };

    return o
  }
};

var nanosocket = function(url = location.href.replace('http', 'ws')){
  const io = emitterify({ attempt: 0 });
  io.ready = io.once('connected');
  io.connect = connect(io, url);
  io.connect(); 
  io.send = data => io.ready.then(socket => socket.send(data));
  return io
};

const { min, pow } = Math;

const connect = (io, url) => () => {
  const { WebSocket, location, setTimeout } = window
      , socket = new WebSocket(url);
  socket.onopen = d => io.emit('connected', socket);
  socket.onmessage = d => io.emit('recv', d.data);
  socket.onclose = d => { 
    io.ready = io.once('connected');
    io.emit('disconnected');
    setTimeout(io.connect, backoff(++io.attempt));
  };
};

const backoff = (attempt, base = 100, cap = 10000) =>
  min(cap, base * pow(2, attempt));

var is_1 = is;
is.fn      = isFunction;
is.str     = isString;
is.num     = isNumber;
is.obj     = isObject;
is.lit     = isLiteral;
is.bol     = isBoolean;
is.truthy  = isTruthy;
is.falsy   = isFalsy;
is.arr     = isArray;
is.null    = isNull;
is.def     = isDef;
is.in      = isIn;
is.promise = isPromise;
is.stream  = isStream;

function is(v){
  return function(d){
    return d == v
  }
}

function isFunction(d) {
  return typeof d == 'function'
}

function isBoolean(d) {
  return typeof d == 'boolean'
}

function isString(d) {
  return typeof d == 'string'
}

function isNumber(d) {
  return typeof d == 'number'
}

function isObject(d) {
  return typeof d == 'object'
}

function isLiteral(d) {
  return d.constructor == Object
}

function isTruthy(d) {
  return !!d == true
}

function isFalsy(d) {
  return !!d == false
}

function isArray(d) {
  return d instanceof Array
}

function isNull(d) {
  return d === null
}

function isDef(d) {
  return typeof d !== 'undefined'
}

function isPromise(d) {
  return d instanceof Promise
}

function isStream(d) {
  return !!(d && d.next)
}

function isIn(set) {
  return function(d){
    return !set ? false  
         : set.indexOf ? ~set.indexOf(d)
         : d in set
  }
}

var keys = function keys(o) { 
  return Object.keys(is_1.obj(o) || is_1.fn(o) ? o : {})
};

var datum = function datum(node){
  return node.__data__
};

var wrap = function wrap(d){
  return function(){
    return d
  }
};

var str = function str(d){
  return d === 0 ? '0'
       : !d ? ''
       : is_1.fn(d) ? '' + d
       : is_1.obj(d) ? JSON.stringify(d)
       : String(d)
};

var key = function key(k, v){ 
  var set = arguments.length > 1
    , keys$$1 = is_1.fn(k) ? [] : str(k).split('.').filter(Boolean)
    , root = keys$$1.shift();

  return function deep(o, i){
    var masked = {};
    
    return !o ? undefined 
         : !is_1.num(k) && !k ? (set ? replace(o, v) : o)
         : is_1.arr(k) ? (k.map(copy), masked)
         : o[k] || !keys$$1.length ? (set ? ((o[k] = is_1.fn(v) ? v(o[k], i) : v), o)
                                       :  (is_1.fn(k) ? k(o) : o[k]))
                                : (set ? (key(keys$$1.join('.'), v)(o[root] ? o[root] : (o[root] = {})), o)
                                       :  key(keys$$1.join('.'))(o[root]))

    function copy(k){
      var val = key(k)(o);
      val = is_1.fn(v)       ? v(val) 
          : val == undefined ? v
                           : val;
    if (val != undefined) 
        key(k, is_1.fn(val) ? wrap(val) : val)(masked);
    }

    function replace(o, v) {
      keys(o).map(function(k){ delete o[k]; });
      keys(v).map(function(k){ o[k] = v[k]; });
      return o
    }
  }
};

var from_1 = from;
from.parent = fromParent;

function from(o){
  return function(k){
    return key(k)(o)
  }
}

function fromParent(k){
  return datum(this.parentNode)[k]
}

var values = function values(o) {
  return !o ? [] : keys(o).map(from_1(o))
};

var client = createCommonjsModule(function (module) {
module.exports = function({ 
  socket = nanosocket()
} = {}){
  socket.id = 0;

  const server = emitterify({ 
    socket
  , send: send(socket)
  , get subscriptions(){
      return values(socket.on)
        .map(d => d && d[0])
        .filter(d => d && d.type && d.type[0] == '$')
    }
  });
  
  socket
    .once('disconnected')
    .map(d => socket
      .on('connected')
      .map(reconnect(server))
    );

  socket
    .on('recv')
    .map(deserialise)
    .each(({ id, data }) => {
      // TODO: check/warn if no sub
      const sink = socket.on[`$${id}`] && socket.on[`$${id}`][0];

      data.exec ? data.exec(sink, data.value)
    : !id       ? server.emit('recv', data)
                : socket.emit(`$${id}`, data);
    });

  return server
};

const deserialise = input => (new Function(`return ${input}`))();

const reconnect = server => () => server.subscriptions
  .map(({ subscription }) => server.socket.send(subscription));


    
const send = (socket, type) => (data, meta) => {
  if (data instanceof window.Blob) 
    return binary(socket, data, meta)

  const id = str(++socket.id)
      , output = socket.on(`$${id}`)
      , next = (data, count = 0) => socket
          .send(output.source.subscription = str({ id, data, type }))
          .then(d => output.emit('sent', { id, count }));

  data.next 
    ? data.map(next).source.emit('start')
    : next(data);

  output
    .source
    .once('stop')
    .filter(reason => reason != 'CLOSED')
    .map(d => send(socket, 'UNSUBSCRIBE')(id)
      // TODO: also force stop on close of server created sub (?)
      .filter((d, i, n) => n.source.emit('stop', 'CLOSED'))
    );

  return output
};

const binary = (socket, blob, meta, start = 0, blockSize = 1024) => {
  const output = emitterify().on('recv')
      , next = id => () =>  
          start >= blob.size 
            ? output.emit('sent', { id })
            : ( socket.send(blob.slice(start, start += blockSize))
              , window.setTimeout(next(id))
              );

  send(socket, 'BINARY')({ size: blob.size, meta })
    .on('sent', ({ id }) => next(id)())
    .on('progress', received => output.emit('progress', { received, total: blob.size }))
    .map(output.next)
    .source
    .until(output.once('stop'));

  return output
};
});

return client;

}());
