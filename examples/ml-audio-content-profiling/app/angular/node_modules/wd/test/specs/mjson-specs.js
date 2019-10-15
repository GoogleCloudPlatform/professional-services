var nock = require('nock'),
    async = require('async');
require('../helpers/setup');

describe("mjson tests", function() {

  var server;

  before(function() {
    server = nock('http://localhost:5555');
  });

  describe("promise api", function() {
    var browser;

    before(function(done) {
      server.post('/session').reply(303, "OK", {
        'Location': '/session/1234'
      }).get('/session/1234').reply(200, {
          status: 0,
          sessionId: '1234',
          value: {}
      });

      browser = wd.promiseChainRemote('http://localhost:5555/');
      browser
        .init()
        .nodeify(done);
    });

    describe("by ios uiautomation", function() {

      it("element methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/element', {"using":"-ios uiautomation","value":"random stuff"})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: {ELEMENT: '0'},
          });
        server
          .post('/session/1234/elements', {"using":"-ios uiautomation","value":"random stuff"})
          .times(3)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .element('-ios uiautomation', 'random stuff')
            .should.eventually.exist
          .elementByIosUIAutomation('random stuff')
            .should.eventually.exist
          .elementByIosUIAutomationOrNull('random stuff')
            .should.eventually.exist
          .elementByIosUIAutomationIfExists('random stuff')
            .should.eventually.exist
          .hasElementByIosUIAutomation('random stuff')
            .should.eventually.be.ok
          .nodeify(done);
      });

      it("elements methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/elements', {"using":"-ios uiautomation","value":"random stuff"})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .elements('-ios uiautomation', 'random stuff')
            .should.eventually.exist
          .elementsByIosUIAutomation('random stuff')
            .should.eventually.exist
          .nodeify(done);
      });

      it("wait methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/elements', {"using":"-ios uiautomation","value":"random stuff"})
          .times(3)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .waitForElement('-ios uiautomation', 'random stuff')
            .should.eventually.exist
          .waitForElementByIosUIAutomation('random stuff')
            .should.eventually.exist
          .waitForElementsByIosUIAutomation('random stuff')
            .should.eventually.exist
          .nodeify(done);
      });

    });


    describe("by ios class chain", function() {

      it("element methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/element', {"using":"-ios class chain","value":"random stuff"})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: {ELEMENT: '0'},
          });
        server
          .post('/session/1234/elements', {"using":"-ios class chain","value":"random stuff"})
          .times(3)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .element('-ios class chain', 'random stuff')
            .should.eventually.exist
          .elementByIosClassChain('random stuff')
            .should.eventually.exist
          .elementByIosClassChainOrNull('random stuff')
            .should.eventually.exist
          .elementByIosClassChainIfExists('random stuff')
            .should.eventually.exist
          .hasElementByIosClassChain('random stuff')
            .should.eventually.be.ok
          .nodeify(done);
      });

      it("elements methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/elements', {"using":"-ios class chain","value":"random stuff"})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .elements('-ios class chain', 'random stuff')
            .should.eventually.exist
          .elementsByIosClassChain('random stuff')
            .should.eventually.exist
          .nodeify(done);
      });

      it("wait methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/elements', {"using":"-ios class chain","value":"random stuff"})
          .times(3)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .waitForElement('-ios class chain', 'random stuff')
            .should.eventually.exist
          .waitForElementByIosClassChain('random stuff')
            .should.eventually.exist
          .waitForElementsByIosClassChain('random stuff')
            .should.eventually.exist
          .nodeify(done);
      });

    });

    describe("by ios predicate string", function() {

      it("element methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/element', {"using":"-ios predicate string","value":"random stuff"})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: {ELEMENT: '0'},
          });
        server
          .post('/session/1234/elements', {"using":"-ios predicate string","value":"random stuff"})
          .times(3)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .element('-ios predicate string', 'random stuff')
            .should.eventually.exist
          .elementByIosPredicateString('random stuff')
            .should.eventually.exist
          .elementByIosPredicateStringOrNull('random stuff')
            .should.eventually.exist
          .elementByIosPredicateStringIfExists('random stuff')
            .should.eventually.exist
          .hasElementByIosPredicateString('random stuff')
            .should.eventually.be.ok
          .nodeify(done);
      });

      it("elements methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/elements', {"using":"-ios predicate string","value":"random stuff"})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .elements('-ios predicate string', 'random stuff')
            .should.eventually.exist
          .elementsByIosPredicateString('random stuff')
            .should.eventually.exist
          .nodeify(done);
      });

      it("wait methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/elements', {"using":"-ios predicate string","value":"random stuff"})
          .times(3)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .waitForElement('-ios predicate string', 'random stuff')
            .should.eventually.exist
          .waitForElementByIosPredicateString('random stuff')
            .should.eventually.exist
          .waitForElementsByIosPredicateString('random stuff')
            .should.eventually.exist
          .nodeify(done);
      });

    });

    describe("by android uiautomator", function() {

      it("element methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/element', {"using":"-android uiautomator","value":"random stuff"})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: {ELEMENT: '0'},
          });
        server
          .post('/session/1234/elements', {"using":"-android uiautomator","value":"random stuff"})
          .times(3)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .element('-android uiautomator', 'random stuff')
            .should.eventually.exist
          .elementByAndroidUIAutomator('random stuff')
            .should.eventually.exist
          .elementByAndroidUIAutomatorOrNull('random stuff')
            .should.eventually.exist
          .elementByAndroidUIAutomatorIfExists('random stuff')
            .should.eventually.exist
          .hasElementByAndroidUIAutomator('random stuff')
            .should.eventually.be.ok
          .nodeify(done);
      });

      it("elements methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/elements', {"using":"-android uiautomator","value":"random stuff"})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .elements('-android uiautomator', 'random stuff')
            .should.eventually.exist
          .elementsByAndroidUIAutomator('random stuff')
            .should.eventually.exist
          .nodeify(done);
      });

      it("wait methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/elements', {"using":"-android uiautomator","value":"random stuff"})
          .times(3)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .waitForElement('-android uiautomator', 'random stuff')
            .should.eventually.exist
          .waitForElementByAndroidUIAutomator('random stuff')
            .should.eventually.exist
          .waitForElementsByAndroidUIAutomator('random stuff')
            .should.eventually.exist
          .nodeify(done);
      });

    });

    describe("by android datamatcher", function() {

      it("element methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/element', {"using":"-android datamatcher","value":"random stuff"})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: {ELEMENT: '0'},
          });
        server
          .post('/session/1234/elements', {"using":"-android datamatcher","value":"random stuff"})
          .times(3)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .element('-android datamatcher', 'random stuff')
            .should.eventually.exist
          .elementByAndroidDataMatcher('random stuff')
            .should.eventually.exist
          .elementByAndroidDataMatcherOrNull('random stuff')
            .should.eventually.exist
          .elementByAndroidDataMatcherIfExists('random stuff')
            .should.eventually.exist
          .hasElementByAndroidDataMatcher('random stuff')
            .should.eventually.be.ok
          .nodeify(done);
      });

      it("elements methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/elements', {"using":"-android datamatcher","value":"random stuff"})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .elements('-android datamatcher', 'random stuff')
            .should.eventually.exist
          .elementsByAndroidDataMatcher('random stuff')
            .should.eventually.exist
          .nodeify(done);
      });

      it("wait methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/elements', {"using":"-android datamatcher","value":"random stuff"})
          .times(3)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .waitForElement('-android datamatcher', 'random stuff')
            .should.eventually.exist
          .waitForElementByAndroidDataMatcher('random stuff')
            .should.eventually.exist
          .waitForElementsByAndroidDataMatcher('random stuff')
            .should.eventually.exist
          .nodeify(done);
      });

    });

    describe("by accessibility id", function() {

      it("element methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/element', {"using":"accessibility id","value":"random stuff"})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: {ELEMENT: '0'},
          });
        server
          .post('/session/1234/elements', {"using":"accessibility id","value":"random stuff"})
          .times(3)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .element('accessibility id', 'random stuff')
            .should.eventually.exist
          .elementByAccessibilityId('random stuff')
            .should.eventually.exist
          .elementByAccessibilityIdOrNull('random stuff')
            .should.eventually.exist
          .elementByAccessibilityIdIfExists('random stuff')
            .should.eventually.exist
          .hasElementByAccessibilityId('random stuff')
            .should.eventually.be.ok
          .nodeify(done);
      });

      it("elements methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/elements', {"using":"accessibility id","value":"random stuff"})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .elements('accessibility id', 'random stuff')
            .should.eventually.exist
          .elementsByAccessibilityId('random stuff')
            .should.eventually.exist
          .nodeify(done);
      });

      it("wait methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/elements', {"using":"accessibility id","value":"random stuff"})
          .times(3)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: '0'}],
          });
        browser
          .waitForElement('accessibility id', 'random stuff')
            .should.eventually.exist
          .waitForElementByAccessibilityId('random stuff')
            .should.eventually.exist
          .waitForElementsByAccessibilityId('random stuff')
            .should.eventually.exist
          .nodeify(done);
      });

    });

    describe("by image", function() {

      it("element methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/element', {"using":"-image","value":"iVBOR"})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: {ELEMENT: 'appium-image-element-0'},
          });
        server
          .post('/session/1234/elements', {"using":"-image","value":"iVBOR"})
          .times(3)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: 'appium-image-element-0'}],
          });
        browser
          .element('-image', 'iVBOR')
            .should.eventually.exist
          .elementByImage('iVBOR')
            .should.eventually.exist
          .elementByImageOrNull('iVBOR')
            .should.eventually.exist
          .elementByImageIfExists('iVBOR')
            .should.eventually.exist
          .hasElementByImage('iVBOR')
            .should.eventually.be.ok
          .nodeify(done);
      });

      it("elements methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/elements', {"using":"-image","value":"iVBOR"})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: 'appium-image-element-0'}],
          });
        browser
          .elements('-image', 'iVBOR')
            .should.eventually.exist
          .elementsByImage('iVBOR')
            .should.eventually.exist
          .nodeify(done);
      });

      it("wait methods should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/elements', {"using":"-image","value":"iVBOR"})
          .times(3)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [{ELEMENT: 'appium-image-element-0'}],
          });
        browser
          .waitForElement('-image', 'iVBOR')
            .should.eventually.exist
          .waitForElementByImage('iVBOR')
            .should.eventually.exist
          .waitForElementsByImage('iVBOR')
            .should.eventually.exist
          .nodeify(done);
      });

    });

    describe("actions", function() {

      it("touch actions should work", function(done) {
        browser.chain()
        .then(function() {
          nock.cleanAll();
          server
            .post('/session/1234/element', {"using":"id","value":"random"})
            .reply(200, {
              status: 0,
              sessionId: '1234',
              value: {ELEMENT: '0'},
            })
            .post('/session/1234/touch/perform', {"actions": [
              {"action":"press","options":{x: 100, y: 5}},
              {"action":"release","options":{}}
            ]})
            .times(2)
            .reply(200, {
              status: 0,
              sessionId: '1234',
              // TODO check what the return is like
              value: [{'not sure': '0'}],
            });
          var el;
          return browser
            .elementById('random').then(function(_el) { el=_el; })
            .then(function() {
              var action = new wd.TouchAction();
              action.press({x: 100, y: 5}).release();
              return browser
                .performTouchAction(action);
            }).then(function() {
              var action = new wd.TouchAction(browser);
              action.press({x: 100, y: 5}).release();
              return action.perform();
            });
        }).nodeify(done);
      });

      it("multi actions should work", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/element', {"using":"id","value":"random"})
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: {ELEMENT: '0'},
          });
        var el;
        browser
          .elementById('random').then(function(_el) { el = _el; })
          .then(function() {
            nock.cleanAll();
            server
              .post('/session/1234/touch/multi/perform', {
                "elementId":"0",
                "actions":[
                  [{"action":"tap","options":{"x": 100,"y":200}}],
                  [{"action":"tap","options":{"x":50,"y":25}}]
                ]})
              .times(4)
              .reply(200, {
                status: 0,
                sessionId: '1234',
                // TODO check what the return is like
                value: [{'not sure': '0'}],
              });
          })
          .then(function() {
            var a1 = new wd.TouchAction().tap({x: 100, y: 200});
            var a2 = new wd.TouchAction().tap({x: 50, y: 25});
            var ma = new wd.MultiAction().add(a1, a2);
            return browser.performMultiAction(el, ma);
          })
          .then(function() {
            var a1 = new wd.TouchAction().tap({x: 100, y: 200});
            var a2 = new wd.TouchAction().tap({x: 50, y: 25});
            var ma = new wd.MultiAction().add(a1, a2);
            return browser.performMultiAction(el, ma);
          })
          .then(function() {
            var a1 = new wd.TouchAction().tap({x: 100, y: 200});
            var a2 = new wd.TouchAction().tap({x: 50, y: 25});
            var ma = new wd.MultiAction().add(a1, a2);
            return el.performMultiAction(ma);
          })
          .then(function() {
            var a1 = new wd.TouchAction().tap({x: 100, y: 200});
            var a2 = new wd.TouchAction().tap({x: 50, y: 25});
            var ma = new wd.MultiAction(el).add(a1, a2);
            return ma.perform();
          })
          .then(function() {
            nock.cleanAll();
            server
              .post('/session/1234/touch/multi/perform', {
                "actions":[
                  [{"action":"tap","options":{"x": 100,"y":200}}],
                  [{"action":"tap","options":{"x":50,"y":25}}]
                ]})
              .times(2)
              .reply(200, {
                status: 0,
                sessionId: '1234',
                // TODO check what the return is like
                value: [{'not sure': '0'}],
              });
          })
          .then(function() {
            var a1 = new wd.TouchAction().tap({x: 100, y: 200});
            var a2 = new wd.TouchAction().tap({x: 50, y: 25});
            var ma = new wd.MultiAction().add(a1, a2);
            return browser.performMultiAction(ma);
          })
          .then(function() {
            var a1 = new wd.TouchAction().tap({x: 100, y: 200});
            var a2 = new wd.TouchAction().tap({x: 50, y: 25});
            var ma = new wd.MultiAction(browser).add(a1, a2);
            return ma.perform();
          })
          .nodeify(done);
      });

      it('w3c actions should work', function (done) {
        nock.cleanAll();
        server
          .post('/session/1234/actions', {
            actions: [{
              type: "pointer",
              id: "finger1",
              parameters: {
                pointerType: "touch"
              },
              actions: [{
                type: "pointerMove",
                duration: 0,
                x: 100,
                y: 100
              }, {
                type: "pointerDown",
                button: 0
              }, {
                type: "pause",
                duration: 500
              }, {
                type: "pointerMove",
                duration: 1000,
                  origin: "pointer",
                  x: -50,
                  y: 100
              }, {
                  type: "pointerUp",
                  button: 0
              }]
            }, {
              type: "pointer",
              id: "finger2",
              parameters: {
                  "pointerType": "touch"
              },
              actions: [{
                  type: "pointerMove",
                  "duration": 0,
                  "x": 200,
                  "y": 200
              }, {
                  type: "pointerDown",
                  button: 0
              }, {
                  type: "pause",
                  "duration": 300
              }, {
                  type: "pointerMove",
                  "duration": 1000,
                  "origin": "pointer",
                  "x": 50,
                  "y": 100
              }, {
                  type: "pointerUp",
                  button: 0
              }]
            }]
        })
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: null,
          });
        var actions = new wd.W3CActions(browser);
        var touchInput = actions.addTouchInput();
        touchInput.pointerMove({duration: 0, x: 100, y: 100});
        touchInput.pointerDown({button: 0});
        touchInput.pause({duration: 500});
        touchInput.pointerMove({duration: 1000, origin: 'pointer', x: -50, y: 100});
        touchInput.pointerUp({button: 0});
        var secondTouchInput = actions.addTouchInput();
        secondTouchInput.pointerMove({duration: 0, x: 200, y: 200});
        secondTouchInput.pointerDown({button: 0});
        secondTouchInput.pause({duration: 300});
        secondTouchInput.pointerMove({duration: 1000, origin: 'pointer', x: 50, y: 100});
        secondTouchInput.pointerUp({button: 0});
        actions.perform(browser)
          .then(function (value) {
            should.equal(value, null);
          }).nodeify(done);
      });

      it('w3c release should work', function (done) {
        nock.cleanAll();
        server
          .delete('/session/1234/actions')
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: null,
          });

        browser.releaseW3CActions()
          .then(function (value) {
            should.equal(value, null);
          }).nodeify(done);
      });
    });

    describe("device methods", function() {

      it("shakeDevice", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/appium/device/shake', {})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
          });
        browser
          .shakeDevice()
          .shake()
          .nodeify(done);
      });

      it("touchId", function(done){
        nock.cleanAll();
        server
          .post('/session/1234/appium/simulator/touch_id', {match: true})
          .times(1)
          .reply(200, {
            sessionId: '1234',
          });

        browser
          .touchId(true)
          .nodeify(done);
      });

      it("toggleTouchIdEnrollment", function(done){
        nock.cleanAll();
        server
          .post('/session/1234/appium/simulator/toggle_touch_id_enrollment')
          .times(1)
          .reply(200, {
            sessionId: '1234',
          });

        browser
          .toggleTouchIdEnrollment(true)
          .nodeify(done);
      });

      it("lockDevice", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/appium/device/lock', {seconds: 3})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
          });
        browser
          .lockDevice(3)
          .lock(3)
          .nodeify(done);
      });

      describe("deviceKeyEvent", function() {
        it("keycode only", function(done) {
          nock.cleanAll();
          server
            .post('/session/1234/appium/device/keyevent', {keycode: 3})
            .reply(200, {
              status: 0,
              sessionId: '1234',
            });
          browser
            .deviceKeyEvent(3)
            .nodeify(done);
        });
        it("keycode only + metastate", function(done) {
          nock.cleanAll();
          server
            .post('/session/1234/appium/device/keyevent', {keycode: 3, metastate: "abcd"})
            .reply(200, {
              status: 0,
              sessionId: '1234',
            });
          browser
            .deviceKeyEvent(3, "abcd")
            .nodeify(done);
        });
        it("pressDeviceKey", function(done) {
          nock.cleanAll();
          server
            .post('/session/1234/appium/device/keyevent', {keycode: 3})
            .reply(200, {
              status: 0,
              sessionId: '1234',
            });
          browser
            .pressDeviceKey(3)
            .nodeify(done);
        });
      });

      describe("pressKeycode", function() {
        it("keycode only", function(done) {
          nock.cleanAll();
          server
            .post('/session/1234/appium/device/press_keycode', {keycode: 3})
            .reply(200, {
              status: 0,
              sessionId: '1234',
            });
          browser
            .pressKeycode(3)
            .nodeify(done);
        });
        it("keycode + metastate", function(done) {
          nock.cleanAll();
          server
            .post('/session/1234/appium/device/press_keycode', {keycode: 3, metastate: "abcd"})
            .reply(200, {
              status: 0,
              sessionId: '1234',
            });
          browser
            .pressKeycode(3, "abcd")
            .nodeify(done);
        });

        it("keycode + metastate + flags", function(done) {
          nock.cleanAll();
          server
            .post('/session/1234/appium/device/press_keycode', {keycode: 3, metastate: "abcd", flags: 8224})
            .reply(200, {
              status: 0,
              sessionId: '1234',
            });
          browser
            .pressKeycode(3, "abcd", [0x20, 0x2000])
            .nodeify(done);
        });
      });

      describe("longPressKeycode", function() {
        it("keycode only", function(done) {
          nock.cleanAll();
          server
            .post('/session/1234/appium/device/long_press_keycode', {keycode: 3})
            .reply(200, {
              status: 0,
              sessionId: '1234',
            });
          browser
            .longPressKeycode(3)
            .nodeify(done);
        });

        it("keycode + metastate", function(done) {
          nock.cleanAll();
          server
            .post('/session/1234/appium/device/long_press_keycode', {keycode: 3, metastate: "abcd"})
            .reply(200, {
              status: 0,
              sessionId: '1234',
            });
          browser
            .longPressKeycode(3, "abcd")
            .nodeify(done);
        });

        it("keycode + metastate + flags", function(done) {
          nock.cleanAll();
          server
            .post('/session/1234/appium/device/long_press_keycode', {keycode: 3, metastate: "abcd", flags: 8224})
            .reply(200, {
              status: 0,
              sessionId: '1234',
            });
          browser
            .longPressKeycode(3, "abcd", [32, 8192])
            .nodeify(done);
        });
      });

      describe("rotateDevice", function() {
        it("without element", function(done) {
          nock.cleanAll();
          server
            .post('/session/1234/appium/device/rotate',
              {x: 114, y: 198, duration: 5, radius: 3, rotation: 220, touchCount: 2})
            .times(2)
            .reply(200, {
              status: 0,
              sessionId: '1234',
            });
          browser
            .rotateDevice({x: 114, y: 198, duration: 5, radius: 3, rotation: 220, touchCount: 2})
            .rotate({x: 114, y: 198, duration: 5, radius: 3, rotation: 220, touchCount: 2})
            .nodeify(done);
        });
        it("with element", function(done) {
          nock.cleanAll();
          server
            .post('/session/1234/element', {"using":"id","value":"random"})
            .reply(200, {
              status: 0,
              sessionId: '1234',
              value: {ELEMENT: '0'},
            })
            .post('/session/1234/appium/device/rotate',
              {x: 114, y: 198, duration: 5, radius: 3, rotation: 220, touchCount: 2, element: "0"})
            .times(3)
            .reply(200, {
              status: 0,
              sessionId: '1234',
            });
          browser
            .elementById('random').then(function(el) {
              return browser
                .rotateDevice(el, {x: 114, y: 198, duration: 5, radius: 3,
                  rotation: 220, touchCount: 2})
                .rotate(el, {x: 114, y: 198, duration: 5, radius: 3,
                  rotation: 220, touchCount: 2})
                .then(function() {
                  return el
                    .rotate({x: 114, y: 198, duration: 5, radius: 3,
                      rotation: 220, touchCount: 2});
                });
            })
            .nodeify(done);
        });
      });

      it("getCurrentDeviceActivity", function(done) {
        nock.cleanAll();
        server
          .get('/session/1234/appium/device/current_activity')
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: '.activities.PeopleActivity'
          });
        browser
          .getCurrentDeviceActivity()
          .should.become('.activities.PeopleActivity')
          .getCurrentActivity()
          .should.become('.activities.PeopleActivity')
          .nodeify(done);
      });

      it("getCurrentPackage", function(done) {
        nock.cleanAll();
        server
          .get('/session/1234/appium/device/current_package')
          .times(1)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: 'org.fake.package'
          });
        browser
          .getCurrentPackage()
          .should.become('org.fake.package')
          .nodeify(done);
      });

      it("installAppOnDevice", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/appium/device/install_app', {appPath: "http://appium.s3.amazonaws.com/UICatalog6.0.app.zip"})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
          });
        browser
          .installAppOnDevice("http://appium.s3.amazonaws.com/UICatalog6.0.app.zip")
          .installApp("http://appium.s3.amazonaws.com/UICatalog6.0.app.zip")
          .nodeify(done);
      });

      it("removeAppFromDevice", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/appium/device/remove_app', {appId: "rubish"})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
          });
        browser
          .removeAppFromDevice("rubish")
          .removeApp("rubish")
          .nodeify(done);
      });

      it("isAppInstalledOnDevice", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/appium/device/app_installed', {bundleId: "coolApp"})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: true // TODO check return
          });
        browser
          .isAppInstalledOnDevice("coolApp")
            .should.eventually.be.ok
          .isAppInstalled("coolApp")
            .should.eventually.be.ok
          .nodeify(done);
      });

      it("isKeyboardShown", function(done) {
        nock.cleanAll();
        server
          .get('/session/1234/appium/device/is_keyboard_shown')
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: true
          });
        browser
          .isKeyboardShown()
          .should.become(true)
          .nodeify(done);
      });

      it("hideDeviceKeyboard, passing key", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/appium/device/hide_keyboard', {keyName: "Done"})
          .times(1)
          .reply(200, {
            status: 0,
            sessionId: '1234',
          });
        server
          .post('/session/1234/appium/device/hide_keyboard')
          .times(1)
          .reply(200, {
            status: 0,
            sessionId: '1234',
          });
        server
          .post('/session/1234/appium/device/hide_keyboard', {strategy: 'tapOutside'})
          .times(1)
          .reply(200, {
            status: 0,
            sessionId: '1234',
          });
        server
          .post('/session/1234/appium/device/hide_keyboard', {strategy: 'pressKey', key:'Done'})
          .times(1)
          .reply(200, {
            status: 0,
            sessionId: '1234',
          });
        browser
          .hideKeyboard()
          .hideDeviceKeyboard("Done")
          .hideDeviceKeyboard({strategy: 'tapOutside'})
          .hideDeviceKeyboard({strategy: 'pressKey', key:'Done'})
          .nodeify(done);
      });

      it("pushFileToDevice", function(done) {
        var remotePath = '/data/local/tmp/remote.txt';
        var stringData = "random string data " + Math.random();
        var base64Data = new Buffer(stringData).toString('base64');
        nock.cleanAll();
        server
          .post('/session/1234/appium/device/push_file', {path: remotePath, data: base64Data})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
          });
        browser
          .pushFileToDevice(remotePath, base64Data)
          .pushFile(remotePath, base64Data)
          .nodeify(done);
      });

      it("pullFileFromDevice", function(done) {
        var remotePath = '/data/local/tmp/remote.txt';
        var stringData = "random string data " + Math.random();
        var base64Data = new Buffer(stringData).toString('base64');
        nock.cleanAll();
        server
          .post('/session/1234/appium/device/pull_file', {path: remotePath})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: base64Data // TODO: check function return
          });
        browser
          .pullFileFromDevice(remotePath, base64Data)
            .should.become(base64Data)
          .pullFile(remotePath, base64Data)
            .should.become(base64Data)
          .nodeify(done);
      });

      it("pullFolderFromDevice", function(done) {
        var remotePath = '/data/local/tmp/remote';
        var stringData = "not a zip but that doesn't matter " + Math.random();
        var base64Data = new Buffer(stringData).toString('base64');
        nock.cleanAll();
        server
          .post('/session/1234/appium/device/pull_folder', {path: remotePath})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: base64Data // TODO: check function return
          });
        browser
          .pullFolderFromDevice(remotePath, base64Data)
            .should.become(base64Data)
          .pullFolder(remotePath, base64Data)
            .should.become(base64Data)
          .nodeify(done);
      });

      it("toggleAirplaneModeOnDevice", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/appium/device/toggle_airplane_mode', {})
          .times(3)
          .reply(200, {
            status: 0,
            sessionId: '1234'
          });
        browser
          .toggleAirplaneModeOnDevice()
          .toggleAirplaneMode()
          .toggleFlightMode()
          .nodeify(done);
      });

      it("toggleWiFiOnDevice", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/appium/device/toggle_wifi', {})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234'
          });
        browser
          .toggleWiFiOnDevice()
          .toggleWiFi()
          .nodeify(done);
      });

      it("toggleLocationServicesOnDevice", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/appium/device/toggle_location_services', {})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234'
          });
        browser
          .toggleLocationServicesOnDevice()
          .toggleLocationServices()
          .nodeify(done);
      });

      it("toggleDataOnDevice", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/appium/device/toggle_data', {})
          .times(2)
          .reply(200, {
            status: 0,
            sessionId: '1234'
          });
        browser
          .toggleDataOnDevice()
          .toggleData()
          .nodeify(done);
      });

      it("launchApp", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/appium/app/launch', {})
          .reply(200, {
            status: 0,
            sessionId: '1234'
          });
        browser
          .launchApp()
          .nodeify(done);
      });

      it("closeApp", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/appium/app/close', {})
          .reply(200, {
            status: 0,
            sessionId: '1234'
          });
        browser
          .closeApp()
          .nodeify(done);
      });

      it("resetApp", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/appium/app/reset', {})
          .reply(200, {
            status: 0,
            sessionId: '1234'
          });
        browser
          .resetApp()
          .nodeify(done);
      });

      it("backgroundApp", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/appium/app/background', {seconds: 3})
          .reply(200, {
            status: 0,
            sessionId: '1234'
          });
        browser
          .backgroundApp(3)
          .nodeify(done);
      });

      it("endTestCoverageForApp", function(done) {
        var intent = "android.intent.action.BOOT_COMPLETED";
        var path = "/random/path";
        var stringData = "random string data " + Math.random();
        var base64Data = new Buffer(stringData).toString('base64');
        nock.cleanAll();
        server
          .post('/session/1234/appium/app/end_test_coverage', {intent: intent, path: path})
          .times(3)
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: base64Data
          });
        browser
          .endTestCoverageForApp(intent, path)
          .endTestCoverage(intent, path)
          .endCoverage(intent, path)
          .should.become(base64Data)
          .nodeify(done);
      });

      describe("complexFindInApp", function() {
        it("one element", function(done) {
          var selector = "abcd";
          nock.cleanAll();
          server
            .post('/session/1234/appium/app/complex_find', {selector: "abcd"})
            .times(2)
            .reply(200, {
              status: 0,
              sessionId: '1234',
              value: {ELEMENT: '0'}
            });
          browser
            .complexFindInApp(selector)
              .then(function(el) {
                el.value.should.equal('0');
              })
            .complexFind(selector)
              .then(function(el) {
                el.value.should.equal('0');
              }).nodeify(done);
        });
        it("element array", function(done) {
          var selector = "all";
          nock.cleanAll();
          server
            .post('/session/1234/appium/app/complex_find', {selector: "all"})
            .times(2)
            .reply(200, {
              status: 0,
              sessionId: '1234',
              value: [{ELEMENT: '0'}]
            });
          browser
            .complexFindInApp(selector)
              .then(function(els) {
                els[0].value.should.equal('0');
              })
            .complexFind(selector)
              .then(function(els) {
                els[0].value.should.equal('0');
              }).nodeify(done);
        });
      });

      it("getAppStrings", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/appium/app/strings', {language: 'en'})
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: 'abcdefghj'
          });
        browser
          .getAppStrings('en')
          .nodeify(done);
      });

      it("setImmediateValueInApp", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/element', {"using":"id","value":"random"})
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: {ELEMENT: '0'},
          })
          .post('/session/1234/appium/element/0/value', {value: "12345"})
          .times(4)
          .reply(200, {
            status: 0,
            sessionId: '1234'
          });
        browser
          .elementById("random")
          .then(function(el) {
            return browser
              .setImmediateValueInApp(el, "12345")
              .setImmediateValue(el, "12345")
              .then(function() {
                return el
                  .setImmediateValueInApp("12345")
                  .setImmediateValue("12345");
              });
          })
          .nodeify(done);
      });

      it("setNetworkConnection", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/network_connection', {parameters: {type: 5}})
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: 5
          });
        browser
          .setNetworkConnection(5)
            .should.eventually.equal(5)
          .nodeify(done);
      });

      it("getNetworkConnection", function(done) {
        nock.cleanAll();
        server
          .get('/session/1234/network_connection')
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: {value: 5}
          });
        browser
          .getNetworkConnection()
            .should.eventually.deep.equal({value: 5})
          .nodeify(done);
      });

      it("openNotifications", function(done) {
        nock.cleanAll();
        server
          .post('/session/1234/appium/device/open_notifications')
          .reply(200, {
            status: 0,
            sessionId: '1234'
          });
        browser
          .openNotifications()
          .nodeify(done);
      });

      it("availableIMEEngines", function (done) {
        nock.cleanAll();
        server
          .get('/session/1234/ime/available_engines')
          .reply(200, {
            status: 0,
            sessionId: '1234'
          });
        browser
          .availableIMEEngines()
          .nodeify(done);
      });

      it("activateIMEEngine", function (done) {
        nock.cleanAll();
        server
          .post('/session/1234/ime/activate')
          .reply(200, {
            status: 0,
            sessionId: '1234'
          });
        browser
          .activateIMEEngine('some.ime')
          .nodeify(done);
      });

      it("deactivateIMEEngine", function (done) {
        nock.cleanAll();
        server
          .post('/session/1234/ime/deactivate')
          .reply(200, {
            status: 0,
            sessionId: '1234'
          });
        browser
          .deactivateIMEEngine()
          .nodeify(done);
      });

      it("isIMEActive", function (done) {
        nock.cleanAll();
        server
          .get('/session/1234/ime/activated')
          .reply(200, {
            status: 0,
            sessionId: '1234'
          });
        browser
          .isIMEActive()
          .nodeify(done);
      });

      it("activeIMEEngine", function (done) {
        nock.cleanAll();
        server
          .get('/session/1234/ime/active_engine')
          .reply(200, {
            status: 0,
            sessionId: '1234'
          });
        browser
          .activeIMEEngine()
          .nodeify(done);
      });

      it("getDeviceTime", function (done) {
        nock.cleanAll();
        server
          .get('/session/1234/appium/device/system_time')
          .reply(200, {
            status: 0,
            sessionId: '1234'
          });
        browser
          .getDeviceTime()
          .nodeify(done);
      });

      it("getClipboard", function (done) {
        nock.cleanAll();
        server
          .post(
            '/session/1234/appium/device/get_clipboard',
            {contentType: 'plaintext'}
          )
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: 'testing'
          });
        browser
          .getClipboard('plaintext')
            .should.eventually.equal('testing')
          .nodeify(done);
      });

      it("setClipboard", function (done) {
        nock.cleanAll();
        var base64Data = new Buffer.from('Hello').toString('base64');
        server
          .post(
            '/session/1234/appium/device/set_clipboard',
            {content: base64Data, contentType: 'plaintext'}
          )
          .reply(200, {
            status: 0,
            sessionId: '1234'
          });
        browser
          .setClipboard(base64Data, 'plaintext')
          .nodeify(done);
      });

      it("getSupportedPerformanceDataTypes", function (done) {
        nock.cleanAll();
        var supportedTypes = [
          'cpuinfo',
          'memoryinfo',
          'batteryinfo',
          'networkinfo'
        ]
        server
          .post('/session/1234/appium/performanceData/types')
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: supportedTypes
          });
        browser
          .getSupportedPerformanceDataTypes()
          .should.become(supportedTypes)
          .nodeify(done);
      });

      it("getPerformanceData", function (done) {
        nock.cleanAll();
        server
          .post(
            '/session/1234/appium/getPerformanceData',
            {
              packageName: 'org.fake.package',
              dataType: 'batteryinfo'
            }
          )
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [["power"], ["75"]]
          });
        browser
          .getPerformanceData('org.fake.package', 'batteryinfo')
          .should.become([["power"], ["75"]])
          .nodeify(done);
      });

      it("getPerformanceData + dataReadTimeout", function (done) {
        nock.cleanAll();
        server
          .post(
            '/session/1234/appium/getPerformanceData',
            {
              packageName: 'org.fake.package',
              dataType: 'batteryinfo',
              dataReadTimeout: 5
            }
          )
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: [["power"], ["75"]]
          });
        browser
          .getPerformanceData('org.fake.package', 'batteryinfo', 5)
          .should.become([["power"], ["75"]])
          .nodeify(done);
      });
    });
  });

  describe("async callback api", function() {
    var browser;
    before(function(done) {
      server.post('/session').reply(303, "OK", {
        'Location': '/session/1234'
      }).get('/session/1234').reply(200, {
          status: 0,
          sessionId: '1234',
          value: {}
      });
      browser = wd.remote('http://localhost:5555/');
      browser.init(done);
    });

    it("touch actions should work", function(done) {
      nock.cleanAll();
      server
        .post('/session/1234/element', {"using":"id","value":"random"})
        .reply(200, {
          status: 0,
          sessionId: '1234',
          value: {ELEMENT: '0'},
        })
        .post('/session/1234/touch/perform', {"actions": [{"action":"tap","options":{}}]})
        .times(2)
        .reply(200, {
          status: 0,
          sessionId: '1234',
          // TODO check what the return is like
          value: [{'not sure': '0'}],
        });
      var el;
      async.series([
        function(done) {
          browser.elementById('random', function(err, _el) {
            should.not.exist(err);
            el = _el;
            done();
          });
        },
        function(done) {
          var action = new wd.TouchAction().tap();
          browser.performTouchAction(action, function(err, res) {
            should.not.exist(err);
            res.should.exist;
            done();
          });
        },
        function(done) {
          var action = new wd.TouchAction(browser).tap();
          action.perform(function(err, res) {
            should.not.exist(err);
            res.should.exist;
            done();
          });
        },
      ], done);
    });

    it("multi actions should work", function(done) {
        server
          .post('/session/1234/element', {"using":"id","value":"random"})
          .reply(200, {
            status: 0,
            sessionId: '1234',
            value: {ELEMENT: '0'},
          });
      var el;
      async.series([
        function(done) {
          browser.elementById('random', function(err, _el) {
            should.not.exist(err);
            el = _el;
            done();
          });
        },
        function(done) {
          nock.cleanAll();
          server
            .post('/session/1234/touch/multi/perform', {
              "elementId":"0",
              "actions":[
                [{"action":"tap","options":{x: 100, y: 200}}],
                [{"action":"tap","options":{x: 50, y: 25}}]
              ]})
            .times(3)
            .reply(200, {
              status: 0,
              sessionId: '1234',
              // TODO check what the return is like
              value: [{'not sure': '0'}],
            });
          done();
        },
        function(done) {
          var a1 = new wd.TouchAction().tap({x: 100, y: 200});
          var a2 = new wd.TouchAction().tap({x: 50, y: 25});
          var ma = new wd.MultiAction().add(a1, a2);
          browser.performMultiAction(el, ma, function(err, res) {
            should.not.exist(err);
            res.should.exist;
            done();
          });
        },
        function(done) {
          var a1 = new wd.TouchAction().tap({x: 100, y: 200});
          var a2 = new wd.TouchAction().tap({x: 50, y: 25});
          var ma = new wd.MultiAction().add(a1, a2);
          el.performMultiAction(ma, function(err, res) {
            should.not.exist(err);
            res.should.exist;
            done();
          });
        },
        function(done) {
          var a1 = new wd.TouchAction().tap({x: 100, y: 200});
          var a2 = new wd.TouchAction().tap({x: 50, y: 25});
          var ma = new wd.MultiAction(el).add(a1, a2);
          ma.perform(function(err, res) {
            should.not.exist(err);
            res.should.exist;
            done();
          });
        },
        function(done) {
          nock.cleanAll();
          server
            .post('/session/1234/touch/multi/perform', {
              "actions":[
                [{"action":"tap","options":{x: 100, y: 200}}],
                [{"action":"tap","options":{x: 50, y: 25}}]
              ]})
            .times(2)
            .reply(200, {
              status: 0,
              sessionId: '1234',
              // TODO check what the return is like
              value: [{'not sure': '0'}],
            });
          done();
        },
        function(done) {
          var a1 = new wd.TouchAction().tap({x: 100, y: 200});
          var a2 = new wd.TouchAction().tap({x: 50, y: 25});
          var ma = new wd.MultiAction().add(a1, a2);
          browser.performMultiAction(ma, function(err, res) {
            should.not.exist(err);
            res.should.exist;
            done();
          });
        },
        function(done) {
          var a1 = new wd.TouchAction().tap({x: 100, y: 200});
          var a2 = new wd.TouchAction().tap({x: 50, y: 25});
          var ma = new wd.MultiAction(browser).add(a1, a2);
          ma.perform(function(err, res) {
            should.not.exist(err);
            res.should.exist;
            done();
          });
        },
      ], done);

    });

  });
});
