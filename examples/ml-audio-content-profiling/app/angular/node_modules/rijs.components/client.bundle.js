var components = (function () {
  'use strict';

  var is_1 = is;
  is.fn = isFunction;
  is.str = isString;
  is.num = isNumber;
  is.obj = isObject;
  is.lit = isLiteral;
  is.bol = isBoolean;
  is.truthy = isTruthy;
  is.falsy = isFalsy;
  is.arr = isArray;
  is.null = isNull;
  is.def = isDef;
  is.in = isIn;
  is.promise = isPromise;
  is.stream = isStream;
  function is(v) {
      return function (d) {
          return d == v;
      };
  }

  function isFunction(d) {
      return typeof d == 'function';
  }

  function isBoolean(d) {
      return typeof d == 'boolean';
  }

  function isString(d) {
      return typeof d == 'string';
  }

  function isNumber(d) {
      return typeof d == 'number';
  }

  function isObject(d) {
      return typeof d == 'object';
  }

  function isLiteral(d) {
      return d.constructor == Object;
  }

  function isTruthy(d) {
      return !(!d) == true;
  }

  function isFalsy(d) {
      return !(!d) == false;
  }

  function isArray(d) {
      return d instanceof Array;
  }

  function isNull(d) {
      return d === null;
  }

  function isDef(d) {
      return typeof d !== 'undefined';
  }

  function isPromise(d) {
      return d instanceof Promise;
  }

  function isStream(d) {
      return !(!(d && d.next));
  }

  function isIn(set) {
      return function (d) {
          return !set ? false : set.indexOf ? ~set.indexOf(d) : d in set;
      };
  }

  var is$1 = /*#__PURE__*/Object.freeze({
    default: is_1,
    __moduleExports: is_1
  });

  var is$2 = ( is$1 && is_1 ) || is$1;

  var to = {
      arr: toArray,
      obj: toObject
  };
  function toArray(d) {
      return Array.prototype.slice.call(d, 0);
  }

  function toObject(d) {
      var by = 'id';
      return arguments.length == 1 ? (by = d, reduce) : reduce.apply(this, arguments);
      function reduce(p, v, i) {
          if (i === 0) 
              { p = {}; }
          p[is$2.fn(by) ? by(v, i) : v[by]] = v;
          return p;
      }
      
  }
  var to_1 = to.arr;
  var to_2 = to.obj;

  var to$1 = /*#__PURE__*/Object.freeze({
    default: to,
    __moduleExports: to,
    arr: to_1,
    obj: to_2
  });

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var client = typeof window != 'undefined';

  var client$1 = /*#__PURE__*/Object.freeze({
    default: client,
    __moduleExports: client
  });

  var client$2 = ( client$1 && client ) || client$1;

  var owner = client$2 ? window : commonjsGlobal;

  var owner$1 = /*#__PURE__*/Object.freeze({
    default: owner,
    __moduleExports: owner
  });

  var to$2 = ( to$1 && to ) || to$1;

  var owner$2 = ( owner$1 && owner ) || owner$1;

  var log = function log(ns) {
      return function (d) {
          if (!owner$2.console || !console.log.apply) 
              { return d; }
          is$2.arr(arguments[2]) && (arguments[2] = arguments[2].length);
          var args = to$2.arr(arguments), prefix = '[log][' + new Date().toISOString() + ']' + ns;
          args.unshift(prefix.grey ? prefix.grey : prefix);
          return console.log.apply(console, args), d;
      };
  };

  var log$1 = /*#__PURE__*/Object.freeze({
    default: log,
    __moduleExports: log
  });

  var ready = function ready(fn) {
      return document.body ? fn() : document.addEventListener('DOMContentLoaded', fn.bind(this));
  };

  var ready$1 = /*#__PURE__*/Object.freeze({
    default: ready,
    __moduleExports: ready
  });

  var _class = function (definition) { return assign(definition.class ? definition.class : !definition.prototype ? classed(definition) : definition.prototype.render ? definition : definition.prototype.connected ? definition : classed(definition)); };
  var assign = Object.assign;
  var classed = function (render) { return render.class = render.class || (function () {
          function anonymous () {}

          anonymous.prototype.render = function render$1 () {
          render.apply(this, arguments);
      };

          return anonymous;
      }()); };

  var _class$1 = /*#__PURE__*/Object.freeze({
    default: _class,
    __moduleExports: _class
  });

  var promise_1 = promise;
  function promise() {
      var resolve, reject, p = new Promise(function (res, rej) {
          resolve = res, reject = rej;
      });
      arguments.length && resolve(arguments[0]);
      p.resolve = resolve;
      p.reject = reject;
      return p;
  }

  var promise$1 = /*#__PURE__*/Object.freeze({
    default: promise_1,
    __moduleExports: promise_1
  });

  var flatten = function flatten(p, v) {
      if (v instanceof Array) 
          { v = v.reduce(flatten, []); }
      return p = p || [], p.concat(v);
  };

  var flatten$1 = /*#__PURE__*/Object.freeze({
    default: flatten,
    __moduleExports: flatten
  });

  var has = function has(o, k) {
      return k in o;
  };

  var has$1 = /*#__PURE__*/Object.freeze({
    default: has,
    __moduleExports: has
  });

  var has$2 = ( has$1 && has ) || has$1;

  var def = function def(o, p, v, w) {
      if (o.host && o.host.nodeName) 
          { o = o.host; }
      if (p.name) 
          { v = p, p = p.name; }
      !has$2(o, p) && Object.defineProperty(o, p, {
          value: v,
          writable: w
      });
      return o[p];
  };

  var def$1 = /*#__PURE__*/Object.freeze({
    default: def,
    __moduleExports: def
  });

  var promise$2 = ( promise$1 && promise_1 ) || promise$1;

  var flatten$2 = ( flatten$1 && flatten ) || flatten$1;

  var def$2 = ( def$1 && def ) || def$1;

  var noop = function () {};
  var emitterify = function emitterify(body, hooks) {
      body = body || {};
      hooks = hooks || {};
      def$2(body, 'emit', emit, 1);
      def$2(body, 'once', once, 1);
      def$2(body, 'off', off, 1);
      def$2(body, 'on', on, 1);
      body.on['*'] = body.on['*'] || [];
      return body;
      function emit(type, pm, filter) {
          var li = body.on[type.split('.')[0]] || [], results = [];
          for (var i = 0;i < li.length; i++) 
              { if (!li[i].ns || !filter || filter(li[i].ns)) 
              { results.push(call(li[i].isOnce ? li.splice(i--, 1)[0] : li[i], pm)); } }
          for (var i = 0;i < body.on['*'].length; i++) 
              { results.push(call(body.on['*'][i], [type,pm])); }
          return results.reduce(flatten$2, []);
      }
      
      function call(cb, pm) {
          return cb.next ? cb.next(pm) : pm instanceof Array ? cb.apply(body, pm) : cb.call(body, pm);
      }
      
      function on(type, opts, isOnce) {
          var id = type.split('.')[0], ns = type.split('.')[1], li = body.on[id] = body.on[id] || [], cb = typeof opts == 'function' ? opts : 0;
          return !cb && ns ? (cb = body.on[id]['$' + ns]) ? cb : push(observable(body, opts)) : !cb && !ns ? push(observable(body, opts)) : cb && ns ? push((remove(li, body.on[id]['$' + ns] || -1), cb)) : cb && !ns ? push(cb) : false;
          function push(cb) {
              cb.isOnce = isOnce;
              cb.type = id;
              if (ns) 
                  { body.on[id]['$' + (cb.ns = ns)] = cb; }
              li.push(cb);
              (hooks.on || noop)(cb);
              return cb.next ? cb : body;
          }
          
      }
      
      function once(type, callback) {
          return body.on(type, callback, true);
      }
      
      function remove(li, cb) {
          var i = li.length;
          while (~--i) 
              { if (cb == li[i] || cb == li[i].fn || !cb) 
              { (hooks.off || noop)(li.splice(i, 1)[0]); } }
      }
      
      function off(type, cb) {
          remove(body.on[type] || [], cb);
          if (cb && cb.ns) 
              { delete body.on[type]['$' + cb.ns]; }
          return body;
      }
      
      function observable(parent, opts) {
          opts = opts || {};
          var o = emitterify(opts.base || promise$2());
          o.i = 0;
          o.li = [];
          o.fn = opts.fn;
          o.parent = parent;
          o.source = opts.fn ? o.parent.source : o;
          o.on('stop', function (reason) {
              o.type ? o.parent.off(o.type, o) : o.parent.off(o);
              return o.reason = reason;
          });
          o.each = function (fn) {
              var n = fn.next ? fn : observable(o, {
                  fn: fn
              });
              o.li.push(n);
              return n;
          };
          o.pipe = function (fn) {
              return fn(o);
          };
          o.map = function (fn) {
              return o.each(function (d, i, n) {
                  return n.next(fn(d, i, n));
              });
          };
          o.filter = function (fn) {
              return o.each(function (d, i, n) {
                  return fn(d, i, n) && n.next(d);
              });
          };
          o.reduce = function (fn, acc) {
              return o.each(function (d, i, n) {
                  return n.next(acc = fn(acc, d, i, n));
              });
          };
          o.unpromise = function () {
              var n = observable(o, {
                  base: {},
                  fn: function (d) {
                      return n.next(d);
                  }
              });
              o.li.push(n);
              return n;
          };
          o.next = function (value) {
              o.resolve && o.resolve(value);
              return o.li.length ? o.li.map(function (n) {
                  return n.fn(value, n.i++, n);
              }) : value;
          };
          o.until = function (stop) {
              return !stop ? 0 : stop.each ? stop.each(o.stop) : stop.then ? stop.then(o.stop) : stop.call ? o.filter(stop).map(o.stop) : 0;
          };
          o.off = function (fn) {
              return remove(o.li, fn), o;
          };
          o.start = function (stop) {
              o.until(stop);
              o.source.emit('start');
              return o;
          };
          o.stop = function (reason) {
              return o.source.emit('stop', reason);
          };
          o[Symbol.asyncIterator] = function () {
              return {
                  next: function () {
                      return o.wait = new Promise(function (resolve) {
                          o.wait = true;
                          o.map(function (d, i, n) {
                              delete o.wait;
                              o.off(n);
                              resolve({
                                  value: d,
                                  done: false
                              });
                          });
                          o.emit('pull', o);
                      });
                  }
              };
          };
          return o;
      }
      
  };

  var emitterify$1 = /*#__PURE__*/Object.freeze({
    default: emitterify,
    __moduleExports: emitterify
  });

  var emitterify$2 = ( emitterify$1 && emitterify ) || emitterify$1;

  var event = function event(node, index) {
      node = node.host && node.host.nodeName ? node.host : node;
      if (node.on) 
          { return; }
      node.listeners = {};
      var on = function (o) {
          var type = o.type.split('.').shift();
          if (!node.listeners[type]) 
              { node.addEventListener(type, node.listeners[type] = (function (event) { return !event.detail || !event.detail.emitted ? emit(type, [event,
              node.state,node]) : 0; })); }
      };
      var off = function (o) {
          if (!node.on[o.type] || !node.on[o.type].length) {
              node.removeEventListener(o.type, node.listeners[o.type]);
              delete node.listeners[o.type];
          }
      };
      emitterify$2(node, {
          on: on,
          off: off
      });
      var emit = node.emit;
      node.emit = function (type, params) {
          var detail = {
              params: params,
              emitted: true
          }, event = new CustomEvent(type, {
              detail: detail,
              bubbles: false,
              cancelable: true
          });
          node.dispatchEvent(event);
          return emit(type, event);
      };
  };

  var event$1 = /*#__PURE__*/Object.freeze({
    default: event,
    __moduleExports: event
  });

  var classed$1 = ( _class$1 && _class ) || _class$1;

  var event$2 = ( event$1 && event ) || event$1;

  var define = createCommonjsModule(function (module) {
      var noop = function () {}, HTMLElement = client$2 && window.HTMLElement || (function () {
          function anonymous () {}

          return anonymous;
      }()), registry = client$2 && window.customElements || {};
      module.exports = function define(name, component) {
          if (arguments.length == 1) {
              component = name, name = "anon-" + (registry.anon++);
          }
          if (component.hasOwnProperty('wrapper')) 
              { return component.wrapper; }
          if (!name.includes('-')) 
              { return; }
          if (!client$2) 
              { return wrap(classed$1(component)); }
          var wrapped = registry.get(name);
          if (wrapped) {
              if (wrapped.class == classed$1(component)) 
                  { return wrapped; }
              wrapped.class = classed$1(component);
              var instances = Array.from(document.querySelectorAll(name));
              instances.map(function (node) {
                  node.disconnectedCallback();
                  node.methods.map(function (method) {
                      delete node[method];
                  });
                  node.connectedCallback();
              });
          } else {
              registry.define(name, wrapped = wrap(classed$1(component)));
          }
          return wrapped;
      };
      var wrap = function (component) {
          if (!component.hasOwnProperty('wrapper')) 
              { component.wrapper = (function (HTMLElement) {
                      function undefined() {
                  HTMLElement.call(this);
                  event$2(this);
                  this.ready = this.once('ready');
                  this.state = this.state || {};
              }

                      if ( HTMLElement ) undefined.__proto__ = HTMLElement;
                      undefined.prototype = Object.create( HTMLElement && HTMLElement.prototype );
                      undefined.prototype.constructor = undefined;
              undefined.prototype.connectedCallback = function connectedCallback () {
                  var this$1 = this;

                  var ref = component.wrapper.class;
                  var prototype = ref.prototype;
                  this.methods = Object.getOwnPropertyNames(prototype).filter(function (method) { return !(method in disallowed); }).map(function (method) { return (this$1[method] = prototype[method].bind(this$1), method); });
                  return Promise.resolve((this.connected || noop).call(this, this, this.state)).then(function (d) {
                      this$1.emit('ready');
                      return this$1.render();
                  });
              };
              undefined.prototype.render = function render () {
                  var this$1 = this;

                  var ref = component.wrapper.class;
                  var prototype = ref.prototype;
                  return this.pending = this.pending || this.ready.then(function () {
                      delete this$1.pending;
                      return prototype.render.call(this$1, this$1, this$1.state);
                  });
              };
              undefined.prototype.disconnectedCallback = function disconnectedCallback () {
                  (this.disconnected || noop).call(this, this, this.state);
                  this.dispatchEvent(new CustomEvent('disconnected'));
                  this.initialised = false;
              };
              undefined.prototype.get = function get (sel) {
                  return this.querySelector(sel);
              };

                      return undefined;
                  }(HTMLElement)); }
          component.wrapper.class = component;
          return component.wrapper;
      };
      var disallowed = {
          length: 1,
          prototype: 1,
          name: 1,
          render: 1
      };
      registry.anon = registry.anon || 1;
  });

  var define$1 = /*#__PURE__*/Object.freeze({
    default: define,
    __moduleExports: define
  });

  var require$$0 = ( log$1 && log ) || log$1;

  var ready$2 = ( ready$1 && ready ) || ready$1;

  var define$2 = ( define$1 && define ) || define$1;

  var components = function components(ripple) {
      if (!client$2) 
          { return ripple; }
      log$2('creating');
      Node.prototype.render = function () {
          var name = this.nodeName.toLowerCase();
          if (name.includes('-')) {
              this.state = this.state || {};
              return this.fn$ = this.fn$ || ripple.subscribe(name).map(function (component) { return define$2(name, component); });
          }
      };
      Node.prototype.draw = function () {
          this.render();
      };
      ready$2(function () { return Array.from(document.querySelectorAll('*')).filter(function (d) { return d.nodeName.includes('-'); }).map(function (node) { return node.render(); }); });
      return ripple;
  };
  var log$2 = require$$0('[ri/components]');

  return components;

}());
