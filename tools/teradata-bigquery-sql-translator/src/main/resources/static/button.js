// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var green = ['#2baa5e', '#249b54', '#1a8741'];

function mkbutton(canvas, left, top, width, height, colors, depth, depth1, txt) {

  var frStartTop = top + height;

  var lr = new fabric.Rect({
    originX: 'left',
    originY: 'bottom',
    left: left,
    top: top + height + depth,
    width: depth,
    height: height,
    fill: colors[1],
    stroke: colors[1],
    strokeWidth: 0,
    skewY: -45
  });

  var br = new fabric.Rect({
    originX: 'left',
    originY: 'bottom',
    left: lr.left,
    top: lr.top,
    width: width,
    height: depth,
    fill: colors[2],
    stroke: colors[2],
    strokeWidth: 0,
    skewX: -45
  });

  var fr = new fabric.Rect({
    originX: 'left',
    originY: 'bottom',
    left: lr.left + depth,
    top: br.top - depth,
    width: width,
    height: height,
    fill: colors[0],
    stroke: colors[0],
    strokeWidth: 0
  });

  var text = new fabric.Text(txt, {
    originX: 'center',
    originY: 'center',
    left: fr.left + (fr.width / 2),
    top: fr.top - (fr.height / 2),
    fill: '#ffffff',
    fontSize: 28,
    fontFamily: 'Poppins',
    evented: false
  });

  setDefaults(text);
  setDefaults(lr);
  setDefaults(br);
  setDefaults(fr);

  var group = new fabric.Group([lr, br, fr, text], {
    originX: 'left',
    originY: 'bottom'
  });
  setDefaults(group);

  var d0 = 280;
  var sync = function() {
    fr.top = br.top - br.height;
    fr.left = lr.left + lr.width;
    text.left = fr.left + (fr.width / 2);
    text.top = fr.top - (fr.height / 2);
    canvas.renderAll.bind(canvas)();
  }
  var animateFn = function() {
    lr.animate('width', depth1, {
      onChange: sync,
      duration: d0,
      easing: fabric.util.ease.easeOutBounce
    });
    br.animate('height', depth1, {
      duration: d0,
      easing: fabric.util.ease.easeOutBounce
    });
  }

  var d1 = 600;
  var animateUpFn = function() {
    lr.animate('width', depth, {
      duration: d1,
      easing: fabric.util.ease.easeOutBounce
    });
    br.animate('height', depth, {
      onChange: sync,
      duration: d1,
      easing: fabric.util.ease.easeOutBounce
    });
  }

  return {
    group: group,
    animateFn: animateFn,
    animateUpFn: animateUpFn
  }
}

function setDefaults(o) {
  o.hasControls = false;
  o.hasBorders = false;
  o.selectable = false;
  o.hoverCursor = 'default';
}

function createButton(canvasId, colors, w, h, d, d1, onPush) {
  var canvas = new fabric.Canvas(canvasId);
  var btn = mkbutton(canvas, 0, 0, w - d, h - d, colors, d, d1, 'TRANSLATE');
  var onMouseDown = function(e) {
    btn.animateFn();
    onPush();
  }
  var onMouseUp = function(e) { btn.animateUpFn(); }

  canvas.on({
    'mouse:up': onMouseUp,
    'mouse:down': onMouseDown
  });
  canvas.add(btn.group);
  canvas.renderAll();
}

function translate() {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/sql', true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  var sql = document.getElementById('sql').value;
  var onLoadEnd = function(e){
    var json = xhr.response;
    document.getElementById('result').value = json['data'];
  }
  xhr.addEventListener("loadend", onLoadEnd);
  xhr.responseType = "json";
  xhr.send(btoa(sql));
}

window.onload = function(e){
  var onPush = function() {translate();}
  createButton('button', green, 320, 80, 18, 6, onPush);
}