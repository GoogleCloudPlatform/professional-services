var __slice = Array.prototype.slice,
    _ = require('lodash'),
    Webdriver = require('./webdriver'),
    Element = require('./element');

/**
 * new wd.TouchAction()
 * TouchAction constructor
 *
 * @actions
 */
var TouchAction = function (driver) {
  this.driver = driver;
  this.gestures = [];
};

TouchAction.prototype.addGesture = function(action, opts) {
  opts = opts || {};
  var el = opts.element || opts.el;
  if(el && !(el instanceof Element)) {
    throw new Error('Invalid element or el field passed');
  }

  // preparing opts
  var finalOpts = {};
  _(opts).each(function(value, name) {
    if(_.isNumber(value)) {
      finalOpts[name] = value;
    } else if(value instanceof Element) {
      finalOpts[name] = value.value;
    } else if(value) {
      finalOpts[name] = value;
    }
  });
  if(finalOpts.el) {
    finalOpts.element = finalOpts.el;
    delete finalOpts.el;
  }

  // adding action
  this.gestures.push({
    action: action,
    options: finalOpts
  });
};

TouchAction.prototype.toJSON = function() {
  return this.gestures;
};

/**
 * touchAction.longPress({el, x, y})
 * pass el or (x,y) or both
 *
 * @actions
 */
TouchAction.prototype.longPress = function (opts) {
  this.addGesture('longPress', opts);
  return this;
};

/**
 * touchAction.moveTo({el, x, y})
 * pass el or (x,y) or both
 *
 * @actions
 */
TouchAction.prototype.moveTo = function (opts) {
  this.addGesture('moveTo', opts);
  return this;
};

/**
 * touchAction.press({el, x, y})
 * pass el or (x,y) or both
 *
 * @actions
 */
TouchAction.prototype.press = function (opts) {
  this.addGesture('press', opts);
  return this;
};

/**
 * touchAction.release()
 *
 * @actions
 */
TouchAction.prototype.release = function () {
  this.addGesture('release', {});
  return this;
};

/**
 * touchAction.tap({el, x, y, count})
 * pass el or (x,y) or both
 * count is optional
 *
 * @actions
 */
TouchAction.prototype.tap = function (opts) {
  this.addGesture('tap', opts);
  return this;
};

/**
 * touchAction.wait({ms})
 * touchAction.wait(ms)
 * ms is optional
 *
 * @actions
 */
TouchAction.prototype.wait = function (opts) {
  if(_.isNumber(opts)) { opts = {ms: opts}; }
  this.addGesture('wait', opts);
  return this;
};

/**
 * cancel the action
 *
 * @actions
 */
TouchAction.prototype.cancel = function () {
  this.gestures = [];
};

/**
 * perform the action
 *
 * @actions
 */
TouchAction.prototype.perform = function(cb) {
  if(typeof cb === 'function') {
    this.driver.performTouchAction(this, cb);
  } else {
    return this.driver.performTouchAction(this);
  }
};

/**
 * new wd.MultiAction()
 * MultiAction constructor
 *
 * @actions
 */
var MultiAction = function (browserOrElement) {
  if(browserOrElement instanceof Element) {
    this.element = browserOrElement;
    this.browser = this.element.browser;
  } else if (browserOrElement instanceof Webdriver) {
    this.browser = browserOrElement;
  }
  this.actions = [];
};

MultiAction.prototype.toJSON = function() {
  var output = {};
  if(this.element) { output.elementId = this.element.value; }
  output.actions = _(this.actions).map(function(action) {
    return action.toJSON();
  }).value();
  return output;
};

/**
 * multiAction.add(touchAction)
 *
 * @actions
 */
MultiAction.prototype.add = function () {
  var actions = __slice.call(arguments, 0);
  this.actions = this.actions.concat(actions);
  return this;
};

/**
 * multiAction.cancel()
 *
 * @actions
 */
MultiAction.prototype.cancel = function() {
  this.actions = [];
};

/**
 * multiAction.perform()
 *
 * @actions
 */
MultiAction.prototype.perform = function(cb) {
  if(typeof cb === 'function') {
    if(this.element){
      this.element.performMultiAction(this, cb);
    } else {
      this.browser.performMultiAction(this, cb);
    }
  } else {
    if(this.element){
      return this.element.performMultiAction(this);
    } else {
      return this.browser.performMultiAction(this);
    }
  }
};

/**
 * new InputDevice({type?, id?})
 * 
 * type is either pointer, key, or none (default is 'none')
 */
var InputDevice = function (opts) {
  opts = opts || {};
  this.type = opts.type || "none";
  this.id = opts.id;
  if (this.type === "pointer") {
    if (opts.pointerType) {
      this.parameters = {};
      this.parameters.pointerType = opts.pointerType;
    } else if (_.isObject(opts.parameters)) {
      this.parameters = opts.parameters;
    } else {
      // Defaults to 'touch' because
      this.parameters = {
        pointerType: 'touch'
      }; 
    }
  }
  this.actions = [];
};

InputDevice.ACTION_TYPES = {
  KEY: "key",
  POINTER: "pointer",
  NONE: "none"
};

// Map special keys to unicode characters
InputDevice.KEYS = {
  "UNIDENTIFIED": "\uE000",
  "CANCEL": "\uE001",
  "HELP": "\uE002",
  "BACKSPACCE": "\uE003",
  "TAB": "\uE004",
  "CLEAR": "\uE005",
  "RETURN": "\uE006",
  "ENTER": "\uE007",
  "SHIFT": "\uE008",
  "CONTROL": "\uE009",
  "ALT": "\uE00A",
  "PAUSE": "\uE00B",
  "ESCAPE": "\uE00C",
  "WHITESPACE": "\uE00D",
  "PAGE_UP": "\uE00E",
  "PAGE_DOWN": "\uE00F",
  "END": "\uE010",
  "HOME": "\uE011",
  "ARROW_LEFT": "\uE012",
  "ARROW_UP": "\uE013",
  "ARROW_RIGHT": "\uE014",
  "ARROW_DOWN": "\uE015",
  "INSERT": "\uE016",
  "DELETE": "\uE017",
  ";": "\uE018",
  "=": "\uE019",
  "0": "\uE01A",
  "1": "\uE01B",
  "2": "\uE01C",
  "3": "\uE01D",
  "4": "\uE01E",
  "5": "\uE01F",
  "6": "\uE020",
  "7": "\uE021",
  "8": "\uE022",
  "9": "\uE023",
  "*": "\uE024",
  "+": "\uE025",
  ",": "\uE026",
  "-": "\uE027",
  ".": "\uE028",
  "/": "\uE029",
  "F1": "\uE031",
  "F2": "\uE032",
  "F3": "\uE033",
  "F4": "\uE034",
  "F5": "\uE035",
  "F6": "\uE036",
  "F7": "\uE037",
  "F8": "\uE038",
  "F9": "\uE039",
  "F10": "\uE03A",
  "F11": "\uE03B",
  "F12": "\uE03C",
  "META": "\uE03D",
  "ZENKAKU_HANKAKU": "\uE040"
};

InputDevice.prototype.addAction = function (actionType, opts) {
  // preparing opts
  var finalOpts = {};
  _(opts).each(function(value, name) {
    if(_.isNumber(value)) {
      finalOpts[name] = value;
    } else if(value instanceof Element) {
      finalOpts[name] = value.value;
    } else if(value) {
      finalOpts[name] = value;
    }
  });

  this.actions.push(Object.assign({
    type: actionType
  }, finalOpts));
};

/**
 * pause(duration)
 * 
 * Pause this input source for a duration (in ms)
 * 
 * value is a string containing a single Unicode code point (any value in the Unicode code space)
 * 
 * @actions
 */
InputDevice.prototype.pause = function(opts) {
  var duration = _.isNumber(opts) ? opts : opts.duration;
  this.addAction("pause", {duration: duration});
};

/**
 * keyDown({value})
 * 
 * Press a key.
 * 
 * value is a string containing a single Unicode code point (any value in the Unicode code space)
 * 
 * @actions
 */
InputDevice.prototype.keyDown = function(opts) {
  return this.keyPressEvent("keyDown", opts);
};

/**
 * keyUp({value})
 * 
 * Release a key press.
 * 
 * value is a string containing a single Unicode code point (any value in the Unicode code space)
 * 
 * @actions
 */
InputDevice.prototype.keyUp = function (opts) {
  return this.keyPressEvent("keyUp", opts);
};

InputDevice.prototype.keyPressEvent = function (type, opts) {
  opts = opts || {};
  if (_.isString(opts)) {
    opts = {value: opts};
  }
  this.addAction(type, opts);
  return this;

};

/**
 * pointerDown({button})
 * 
 * Depress a pointer button. Defaults to 0.
 * 
 * @actions 
 */
InputDevice.prototype.pointerDown = function (opts) {
  return this.pointerButtonAction("pointerDown", opts);
};

/**
 * pointerUp({button})
 * 
 * Release a pointer button. Defaults to 0.
 * 
 * @actions
 */
InputDevice.prototype.pointerUp = function (opts) {
  return this.pointerButtonAction("pointerUp", opts);
};

InputDevice.prototype.pointerButtonAction = function (type, opts) {
  opts = opts || {};
  if (_.isNumber(opts)) {
    opts = {button: opts};
  } else if (_.isNil(opts.button)) {
    opts.button = 0;
  }
  this.addAction(type, opts);
  return this;

};

InputDevice.prototype.pointerCancel = function (opts) {
  this.addAction("pointerCancel", _.defaults(opts, {
    button: 0
  }));
  return this;
};

/**
 * pointerMove({el, duration, origin, x, y})
 * 
 * * 'origin' must be either viewport or pointer (default is 'viewport'). 
 * * If el is set, origin will be that element
 * * 'x, y' Are coordinates relative to the origin
 * * 'duration' is an optional time in ms that determines how long the movement takes (default 0)
 * 
 * @param {*} opts 
 */
InputDevice.prototype.pointerMove = function (opts) {
  opts = opts || {};
  var el = opts.el || opts.element;

  if(el && !(el instanceof Element)) {
    throw new Error('Invalid element or el field passed');
  }

  if(el instanceof Element) {
    opts.origin = {"element-6066-11e4-a52e-4f735466cecf": el.value};
  }
  this.addAction("pointerMove", opts);
};

InputDevice.prototype.toJSON = function () {
  return _.omitBy(this, _.isFunction);
};

var W3CActions = function (driver) {
  this.driver = driver;
  this.touchCount = 1;
  this.inputs = {};
};

/**
 * w3cActions.addInputDevice(inputSource)
 *
 * @actions
 */
W3CActions.prototype.addInputDevice = function (inputSource) {
  if (_.isNil(inputSource.id)) {
    if (inputSource.type === "pointer") {
      var pointerType = inputSource.parameters.pointerType;
      if (pointerType === "touch") {
        inputSource.id = "finger" + this.touchCount; // finger1, finger2, etc... for multi touch
        this.touchCount++;
      } else if(pointerType === "mouse") {
        inputSource.id = "default mouse"; // Same name as what Java client uses
      } else {
        inputSource.id = pointerType;
      }
    } else {
      inputSource.id = inputSource.type === "key" ? "keyboard" : inputSource.type;
    }
    this.inputs[inputSource.id] = new InputDevice(inputSource);
  }
  return this.inputs[inputSource.id];
};

W3CActions.prototype.addTouchInput = function () {
  return this.addInputDevice({type: "pointer", parameters: {pointerType: "touch"}});
};

W3CActions.prototype.addMouseInput = function () {
  return this.addInputDevice({type: "pointer", parameters: {pointerType: "mouse"}});
};

W3CActions.prototype.addPenInput = function () {
  return this.addInputDevice({type: "pointer", parameters: {pointerType: "pen"}});
};

W3CActions.prototype.addKeyInput = function () {
  return this.addInputDevice({type: "key"});
};

/**
 * multiAction.perform()
 *
 * @actions
 */
W3CActions.prototype.perform = function(cb) {
  if(typeof cb === 'function') {
    return this.driver.performW3CActions(this, cb);
  } else {
    return this.driver.performW3CActions(this);
  }
};

W3CActions.prototype.toJSON = function () {
  var actions = _.values(this.inputs, function (input) { input.toJSON(); });
  return {
    actions: actions
  };
};

module.exports = {
  TouchAction: TouchAction,
  MultiAction: MultiAction,
  InputDevice: InputDevice,
  W3CActions: W3CActions
};
