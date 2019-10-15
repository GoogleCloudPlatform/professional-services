var Element = require('../../lib/element');
require('../helpers/setup');

describe("mjson action tests", function() {
  var el5 = new Element(5, {});
  //var el10 = new Element(10, null);

  describe("TouchAction", function() {
    describe("tap", function() {

      it("no params", function() {
        var action = new wd.TouchAction();
        action.tap();
        action.gestures.should.deep.equal([{action: 'tap', options: {}}]);
      });
      it("params: {el: el}", function() {
        var action = new wd.TouchAction();
        action.tap({el: el5});
        action.gestures.should.deep.equal([{action: 'tap', options: {element: 5}}]);
      });
      it("params: {element: el}", function() {
        var action = new wd.TouchAction();
        action.tap({el: el5});
        action.gestures.should.deep.equal([{action: 'tap', options: {element: 5}}]);
      });
      it("params: {element: el, x:x, y:y}", function() {
        var action = new wd.TouchAction();
        action.tap({el: el5, x:5, y: 10});
        action.gestures.should.deep.equal([{action: 'tap', options: {element: 5, x:5, y: 10}}]);
      });
      it("params: {element: el, x:x, y:y, count:count}", function() {
        var action = new wd.TouchAction();
        action.tap({el: el5, x: 5, y: 10, count: 2});
        action.gestures.should.deep.equal([{action: 'tap', options: {element: 5, x:5, y: 10, count: 2}}]);
      });
      it("params: {x:x, y:y}", function() {
        var action = new wd.TouchAction();
        action.tap({x:5, y: 10});
        action.gestures.should.deep.equal([{action: 'tap', options: {x:5, y: 10}}]);
      });
      it("params: {x:x, y:y, count:count}", function() {
        var action = new wd.TouchAction();
        action.tap({x: 5, y: 10, count: 2});
        action.gestures.should.deep.equal([{action: 'tap', options: {x:5, y: 10, count: 2}}]);
      });
      it("params: {element: el} invalid element", function() {
        function fn() {
          var action = new wd.TouchAction();
          action.tap({el: {value: 5}});  
        }
        fn.should.throw(/Invalid element or el/);
      });        
    });

    describe("longPress", function() {
      it("no params", function() {
        var action = new wd.TouchAction();
        action.longPress();
        action.gestures.should.deep.equal([{action: 'longPress', options: {}}]);
      });
      it("params: {el: el}", function() {
        var action = new wd.TouchAction();
        action.longPress({el: el5});
        action.gestures.should.deep.equal([{action: 'longPress', options: {element: 5}}]);
      });
      it("params: {element: el}", function() {
        var action = new wd.TouchAction();
        action.longPress({el: el5});
        action.gestures.should.deep.equal([{action: 'longPress', options: {element: 5}}]);
      });
      it("params: {element: el, x:x, y:y}", function() {
        var action = new wd.TouchAction();
        action.longPress({el: el5, x:5, y: 10});
        action.gestures.should.deep.equal([{action: 'longPress', options: {element: 5, x:5, y: 10}}]);
      });
      it("params: {x:x, y:y}", function() {
        var action = new wd.TouchAction();
        action.longPress({x:5, y: 10});
        action.gestures.should.deep.equal([{action: 'longPress', options: {x:5, y: 10}}]);
      });
      it("params: {element: el} invalid element", function() {
        function fn() {
          var action = new wd.TouchAction();
          action.longPress({el: {value: 5}});  
        }
        fn.should.throw(/Invalid element or el/);
      });      
    });

    describe("moveTo", function() {
      it("no params", function() {
        var action = new wd.TouchAction();
        action.moveTo();
        action.gestures.should.deep.equal([{action: 'moveTo', options: {}}]);
      });
      it("params: {el: el}", function() {
        var action = new wd.TouchAction();
        action.moveTo({el: el5});
        action.gestures.should.deep.equal([{action: 'moveTo', options: {element: 5}}]);
      });
      it("params: {element: el}", function() {
        var action = new wd.TouchAction();
        action.moveTo({el: el5});
        action.gestures.should.deep.equal([{action: 'moveTo', options: {element: 5}}]);
      });
      it("params: {element: el, x:x, y:y}", function() {
        var action = new wd.TouchAction();
        action.moveTo({el: el5, x:5, y: 10});
        action.gestures.should.deep.equal([{action: 'moveTo', options: {element: 5, x:5, y: 10}}]);
      });
      it("params: {x:x, y:y}", function() {
        var action = new wd.TouchAction();
        action.moveTo({x:5, y: 10});
        action.gestures.should.deep.equal([{action: 'moveTo', options: {x:5, y: 10}}]);
      });
      it("params: {element: el} invalid element", function() {
        function fn() {
          var action = new wd.TouchAction();
          action.moveTo({el: {value: 5}});  
        }
        fn.should.throw(/Invalid element or el/);
      });      
    });

    describe("press", function() {
      it("no params", function() {
        var action = new wd.TouchAction();
        action.press();
        action.gestures.should.deep.equal([{action: 'press', options: {}}]);
      });
      it("params: {el: el}", function() {
        var action = new wd.TouchAction();
        action.press({el: el5});
        action.gestures.should.deep.equal([{action: 'press', options: {element: 5}}]);
      });
      it("params: {element: el}", function() {
        var action = new wd.TouchAction();
        action.press({el: el5});
        action.gestures.should.deep.equal([{action: 'press', options: {element: 5}}]);
      });
      it("params: {element: el, x:x, y:y}", function() {
        var action = new wd.TouchAction();
        action.press({el: el5, x:5, y: 10});
        action.gestures.should.deep.equal([{action: 'press', options: {element: 5, x:5, y: 10}}]);
      });
      it("params: {x:x, y:y}", function() {
        var action = new wd.TouchAction();
        action.press({x:5, y: 10});
        action.gestures.should.deep.equal([{action: 'press', options: {x:5, y: 10}}]);
      });
      it("params: {element: el} invalid element", function() {
        function fn() {
          var action = new wd.TouchAction();
          action.press({el: {value: 5}});  
        }
        fn.should.throw(/Invalid element or el/);
      });
    });

    describe("release", function() {
      it("no params", function() {
        var action = new wd.TouchAction();
        action.release();
        action.gestures.should.deep.equal([{action: 'release', options: {}}]);
      });      
    });

    describe("wait", function() {
      it("no params", function() {
        var action = new wd.TouchAction();
        action.wait();
        action.gestures.should.deep.equal([{action: 'wait', options: {}}]);
      });      
      it("params: ms", function() {
        var action = new wd.TouchAction();
        action.wait(100);
        action.gestures.should.deep.equal([{action: 'wait', options: {ms: 100}}]);
      });      
     it("params: {ms: ms}", function() {
        var action = new wd.TouchAction();
        action.wait({ms: 100});
        action.gestures.should.deep.equal([{action: 'wait', options: {ms: 100}}]);
      });      
     });

    it("cancel", function() {
      var action = new wd.TouchAction();
      action.tap();
      action.gestures.should.deep.equal([{action: 'tap', options: {}}]);
      action.cancel();
      action.gestures.should.deep.equal([]);
    });

  });

  describe("MultiAction", function() {
    it("without element", function() {
      var m = new wd.MultiAction();
      var a1 = new wd.TouchAction();
      a1.tap({x: 100, y: 50}).release();
      var a2 = new wd.TouchAction();
      a2.press({x: 110, y: 55}).release();
      m.add(a1, a2);
      var expected = {"actions":[[{"action":"tap","options":{"x":100,"y":50}},{"action":"release","options":{}}],[{"action":"press","options":{"x":110,"y":55}},{"action":"release","options":{}}]]};
      m.toJSON().should.deep.equal(expected);
    });

    it("with element", function() {
      var element = new Element(5, {});
      var m = new wd.MultiAction(element);
      var a1 = new wd.TouchAction();
      a1.tap({x: 100, y: 50}).release();
      var a2 = new wd.TouchAction();
      a2.press({x: 110, y: 55}).release();
      m.add(a1, a2);
      var expected = {"elementId": 5, "actions":[[{"action":"tap","options":{"x":100,"y":50}},{"action":"release","options":{}}],[{"action":"press","options":{"x":110,"y":55}},{"action":"release","options":{}}]]};
      m.toJSON().should.deep.equal(expected);
    });

    it("cancel", function() {
      var element = new Element(5, {});
      var m = new wd.MultiAction(element);
      var a1 = new wd.TouchAction();
      a1.tap({x: 100, y: 50}).release();
      var a2 = new wd.TouchAction();
      a2.press({x: 110, y: 55}).release();
      m.add(a1, a2);
      var expected = {"elementId": 5, "actions":[[{"action":"tap","options":{"x":100,"y":50}},{"action":"release","options":{}}],[{"action":"press","options":{"x":110,"y":55}},{"action":"release","options":{}}]]};
      m.toJSON().should.deep.equal(expected);
      m.cancel();
      m.toJSON().should.deep.equal({elementId: 5, actions: []});
    });

  });

  describe('W3C actions', function () {
    describe("Input Device", function () {
      it("none type", function () {
        var input = new wd.InputDevice();
        input.pause(100);
        input.type.should.equal("none");
        input.actions.should.eql([
          {"type": "pause", "duration": 100}
        ]);
      });
      it("key type", function () {
        var input = new wd.InputDevice({
          type: 'key',
          id: 'someKeyboard'
        });
        input.keyDown({value: '\uE008'});
        input.keyDown({value: 's'});
        input.keyUp({value: '\uE008'});
        input.keyUp({value: 's'});
        var expectedActions = [
          {"type": "keyDown", "value": "\uE008"},
          {"type": "keyDown", "value": "s"},
          {"type": "keyUp", "value": "\uE008"},
          {"type": "keyUp", "value": "s"},
        ];
        input.type.should.equal("key");
        input.id.should.equal("someKeyboard");
        input.actions.should.eql(expectedActions);
      });
      it("pointer type", function () {
        var input = new wd.InputDevice({
          type: 'pointer',
          id: 'somePointer',
        });
        input.pointerMove({x: 10, y: 20, duration: 10});
        input.pointerDown();
        input.pointerUp();
        input.pointerDown(2);
        input.pointerUp(2);
        var expectedActions = [
         {"type": "pointerMove", "duration": 10, "x": 10, "y": 20},
         {"type": "pointerDown", "button": 0},
         {"type": "pointerUp", "button": 0},
         {"type": "pointerDown", "button": 2},
         {"type": "pointerUp", "button": 2},
        ];
        input.type.should.equal("pointer");
        input.id.should.equal("somePointer");
        input.actions.should.eql(expectedActions);
      });
      describe('pointer actions', function () {
        it('should accept pointerType parameter', function () {
          var input = new wd.InputDevice({
            type: 'pointer',
            pointerType: 'mouse',
          });
          input.parameters.pointerType.should.equal('mouse');
        });
        it('should accept parameters object', function () {
          var input = new wd.InputDevice({
            type: 'pointer',
            parameters: {pointerType: 'pen'}
          });
          input.parameters.pointerType.should.equal('pen');
        });
        describe('pointerMove, pointerButtonAction, pointerDown, pointerCancel', function () {
          var input;
          beforeEach(function () {
            input = new wd.InputDevice({
              type: 'pointer',
              pointerType: 'mouse',
            });
          });
          it('should take an element', function () {
            input.pointerMove({el: new Element(5, {}), x: 10, y: 20});
            var action = input.actions[0];
            action.origin.should.eql({"element-6066-11e4-a52e-4f735466cecf": 5});
            action.x.should.equal(10);
            action.y.should.equal(20);
          });
          it('should take button alone as number', function () {
            input.pointerButtonAction("pointerDown", 2);
            input.actions[0].button.should.equal(2);
          });
          it('should accept button as an opt', function () {
            input.pointerDown({button: 3});
            input.actions[0].button.should.equal(3);
          });
          it('should default pointer buttons to 0', function () {
            input.pointerDown();
            input.actions[0].button.should.equal(0);
          });
        });
      });
      describe('key actions', function () {
        var input;
        beforeEach(function () {
          input = new wd.InputDevice({
            type: 'pointer',
            pointerType: 'mouse',
          });
        });
        it('should do keyUp when value is provided', function () {
          input.keyDown({value: 'H'});
          input.actions[0].value.should.equal('H');
        });
        it('should do keyDown for raw string', function () {
          input.keyDown('\uE008');
          input.actions[0].value.should.equal('\uE008');
        });
      });
    });

    describe('w3c actions', function () {
      describe('.addInputDevice', function () {
        it('should add input devices and auto-assign the IDs', function () {
          var mouseInput = new wd.InputDevice({
            type: 'pointer',
            pointerType: 'mouse',
          });
          
          var keyInput = new wd.InputDevice({
            type: 'key',
          });

          var touchInputOne = new wd.InputDevice({
            type: 'pointer',
            pointerType: 'touch'
          });

          var touchInputTwo = new wd.InputDevice({
            type: 'pointer',
            pointerType: 'touch'
          });
          
          var w3cActions = new wd.W3CActions();
          w3cActions.addInputDevice(mouseInput);
          w3cActions.addInputDevice(keyInput);
          w3cActions.addInputDevice(touchInputOne);
          w3cActions.addInputDevice(touchInputTwo);

          var actionsAsJson = JSON.parse(JSON.stringify(w3cActions.toJSON()));

          actionsAsJson.should.eql({
            actions: [
              {type: "pointer", id: "default mouse", parameters: {pointerType: "mouse"}, actions: []},
              {type: "key", id: "keyboard", actions: []},
              {type: "pointer", id: "finger1", parameters: {pointerType: "touch"}, actions: []},
              {type: "pointer", id: "finger2", parameters: {pointerType: "touch"}, actions: []}
            ]
          });
          
        });
      });
    });
  });

});
