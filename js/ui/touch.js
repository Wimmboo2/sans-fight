/*
 * touch.js - optional on-screen controls (the "Touch" group of InputManagement.xml):
 * A (= Z) and B (= X) buttons in the top right, and a floating d-pad that appears wherever you put your
 * thumb. Shown on touch devices, or always/never via BTS.C.TOUCH_CONTROLS.
 */
(function (BTS) {
  'use strict';

  var ZONE = 24;
  var pointers = {};               // pointerId -> {x, y}
  var A = null, B = null, pad = null;
  var enabled = false, warned = false;

  function over(sp, p) {
    var b = sp.bbox();
    return p && p.x >= b.l && p.x <= b.r && p.y >= b.t && p.y <= b.b;
  }

  var touch = {
    enabled: function () { return enabled; },

    attach: function (canvas) {
      var mode = BTS.C.TOUCH_CONTROLS;
      var isTouch = typeof window !== 'undefined' && (('ontouchstart' in window) ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));
      enabled = mode === true || (mode === 'auto' && isTouch);
      A = new BTS.Sprite('TouchA', 'Default', 592, 48); A.opacity = 0.5; A.touchId = -1;
      B = new BTS.Sprite('TouchB', 'Default', 480, 48); B.opacity = 0.5; B.touchId = -1;
      if (!enabled) return;

      canvas.addEventListener('pointerdown', function (e) {
        var p = BTS.screen.toGame(e.clientX, e.clientY);
        pointers[e.pointerId] = p;
        if (document.documentElement.requestFullscreen && !document.fullscreenElement && e.pointerType === 'touch') {
          document.documentElement.requestFullscreen().catch(function () {});
        }
        if (over(A, p)) { if (A.touchId === -1) A.touchId = e.pointerId; }
        else if (over(B, p)) { if (B.touchId === -1) B.touchId = e.pointerId; }
        else if (!pad) {
          pad = new BTS.Sprite('TouchDPad', 'Default', p.x, p.y);
          pad.opacity = 0.5; pad.touchId = e.pointerId;
        }
        e.preventDefault();
      });
      canvas.addEventListener('pointermove', function (e) {
        if (pointers[e.pointerId]) pointers[e.pointerId] = BTS.screen.toGame(e.clientX, e.clientY);
      });
      var end = function (e) {
        delete pointers[e.pointerId];
        if (A.touchId === e.pointerId) A.touchId = -1;
        if (B.touchId === e.pointerId) B.touchId = -1;
        if (pad && pad.touchId === e.pointerId) pad = null;
      };
      canvas.addEventListener('pointerup', end);
      canvas.addEventListener('pointercancel', end);
      canvas.style.touchAction = 'none';
    },

    // Called every tick before the input is read.
    update: function () {
      if (!enabled) return;
      var I = BTS.input;
      var pa = pointers[A.touchId], pb = pointers[B.touchId];
      A.setAnim(over(A, pa) ? 'Pressed' : 'Default', true);
      B.setAnim(over(B, pb) ? 'Pressed' : 'Default', true);
      I.setVirtual('Confirm', over(A, pa));
      I.setVirtual('Cancel', over(B, pb));
      var pp = pad && pointers[pad.touchId];
      I.setVirtual('Up', !!pp && pp.y <= pad.y - ZONE);
      I.setVirtual('Down', !!pp && pp.y >= pad.y + ZONE);
      I.setVirtual('Left', !!pp && pp.x <= pad.x - ZONE);
      I.setVirtual('Right', !!pp && pp.x >= pad.x + ZONE);
    },

    warnOnce: function () {
      if (!enabled || warned) return;
      warned = true;
      BTS.text.create('DefaultFont', 'Touch', 16, 400, {
        w: 512, h: 80, scale: 2, name: 'MobileWarn', timeout: 3,
        text: "Don't play on mobile!\nYou have been warned!"
      });
    },
    onBattleStart: function () { touch.warnOnce(); },
    onMenuStart: function () { touch.warnOnce(); },

    draw: function () {
      var cam = { x: 0, y: 0 };
      if (BTS.world && BTS.world.texts) {
        BTS.world.texts.forEach(function (t) { if (t.layer === 'Touch') BTS.draw.text(t, cam); });
      }
      if (!enabled) return;
      BTS.draw.sprite(A, cam);
      BTS.draw.sprite(B, cam);
      if (pad) BTS.draw.sprite(pad, cam);
    }
  };

  BTS.touch = touch;
})(window.BTS = window.BTS || {});
