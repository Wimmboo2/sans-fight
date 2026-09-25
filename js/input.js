/*
 * input.js - the virtual pad from InputManagement.xml.
 * Each tick: Last* = previous state, then the pad is rebuilt from keyboard, gamepad and touch.
 * pressed(k): went down this tick. released(k): went up this tick.
 */
(function (BTS) {
  'use strict';

  var KEYS = ['Up', 'Down', 'Left', 'Right', 'Confirm', 'Cancel', 'Menu'];
  var KEYMAP = {
    ArrowUp: 'Up', KeyW: 'Up',
    ArrowDown: 'Down', KeyS: 'Down',
    ArrowLeft: 'Left', KeyA: 'Left',
    ArrowRight: 'Right', KeyD: 'Right',
    KeyZ: 'Confirm', Enter: 'Confirm', NumpadEnter: 'Confirm',
    KeyX: 'Cancel', ShiftLeft: 'Cancel', ShiftRight: 'Cancel',
    KeyC: 'Menu', ControlLeft: 'Menu', ControlRight: 'Menu'
  };
  var DEADZONE = 0.25;
  var held = {};          // physical keys currently down (by code)
  var tapped = {};        // keys pressed since the last tick (so a very short tap still counts once)
  var extra = {};         // virtual buttons held by touch controls / tests

  var pad = {};
  KEYS.forEach(function (k) { pad[k] = 0; pad['Last' + k] = 0; });

  var input = {
    pad: pad,
    KEYS: KEYS,
    anyKeyHandlers: [],

    // New scene: pretend everything is held so a key held from the previous screen is not a new press.
    resetHeld: function () { KEYS.forEach(function (k) { pad[k] = 1; pad['Last' + k] = 1; }); },

    setVirtual: function (k, down) { extra[k] = down ? 1 : 0; },

    update: function () {
      KEYS.forEach(function (k) { pad['Last' + k] = pad[k]; pad[k] = 0; });
      for (var code in held) if ((held[code] || tapped[code]) && KEYMAP[code]) pad[KEYMAP[code]] = 1;
      tapped = {};
      for (var k in extra) if (extra[k]) pad[k] = 1;
      pollGamepad();
    },

    pressed: function (k) { return pad[k] > pad['Last' + k]; },
    released: function (k) { return pad[k] < pad['Last' + k]; },

    attach: function (target) {
      target.addEventListener('keydown', function (e) {
        if (input.captureKeys === false) return;
        if (KEYMAP[e.code] || e.code === 'Space') e.preventDefault();
        held[e.code] = true;
        tapped[e.code] = true;
        input.anyKeyHandlers.forEach(function (f) { f(e); });
      });
      target.addEventListener('keyup', function (e) { held[e.code] = false; });
      window.addEventListener('blur', function () { held = {}; tapped = {}; });
    },
    captureKeys: true
  };

  function pollGamepad() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    var pads = navigator.getGamepads();
    var gp = pads && pads[0];
    if (!gp) return;
    var ax = gp.axes || [], b = gp.buttons || [];
    function down(i) { return b[i] && b[i].pressed; }
    if ((ax[1] || 0) < -DEADZONE || down(12)) pad.Up = 1;
    if ((ax[1] || 0) > DEADZONE || down(13)) pad.Down = 1;
    if ((ax[0] || 0) < -DEADZONE || down(14)) pad.Left = 1;
    if ((ax[0] || 0) > DEADZONE || down(15)) pad.Right = 1;
    if (down(0)) pad.Confirm = 1;
    if (down(2)) pad.Cancel = 1;
    if (down(9)) pad.Menu = 1;
  }

  BTS.input = input;
})(window.BTS = window.BTS || {});
