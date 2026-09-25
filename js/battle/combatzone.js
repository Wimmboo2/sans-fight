/*
 * combatzone.js - the bullet box ("CombatZone" group of Battle.xml): animated resizing, finish callbacks,
 * the heart clamp and the border walls.
 */
(function (BTS) {
  'use strict';

  var C, U;
  function W() { return BTS.world; }

  var zone = {
    create: function () {
      C = BTS.C; U = BTS.util;
      // Initial size/targets come from the original layout.
      return {
        x: 32, y: 240, w: 576, h: 144,
        targetL: 33, targetT: 251, targetR: 608, targetB: 391,
        visible: false,
        infoText: '',
        speed: C.RESIZE_SPEED,
        endResize: ''
      };
    },

    setSpeed: function (s) { W().zone.speed = U.toInt(s); },

    resize: function (l, t, r, b, finish) {
      var z = W().zone;
      z.targetL = U.toFloat(l); z.targetT = U.toFloat(t);
      z.targetR = U.toFloat(r); z.targetB = U.toFloat(b);
      z.endResize = finish === undefined || finish === null ? '' : String(finish);
      z.visible = true;
    },

    resizeInstant: function (l, t, r, b) {
      var z = W().zone;
      z.targetL = U.toFloat(l); z.targetT = U.toFloat(t);
      z.targetR = U.toFloat(r); z.targetB = U.toFloat(b);
      z.x = z.targetL; z.y = z.targetT;
      z.w = z.targetR - z.targetL; z.h = z.targetB - z.targetT;
      zone.tick(BTS.state.dt);
      z.visible = true;
    },

    tick: function (dt) {
      var z = W().zone, s = z.speed * dt;
      var right = z.x + z.w, bottom = z.y + z.h;
      var X1 = Math.min(s, Math.abs(z.x - z.targetL));
      var Y1 = Math.min(s, Math.abs(z.y - z.targetT));
      var X2 = Math.min(s, Math.abs(right - z.targetR));
      var Y2 = Math.min(s, Math.abs(bottom - z.targetB));

      if (z.x > z.targetL) { z.x -= X1; z.w += X1; }
      else if (z.x < z.targetL) { z.x += X1; z.w -= X1; }
      if (z.y > z.targetT) { z.y -= Y1; z.h += Y1; }
      else if (z.y < z.targetT) { z.y += Y1; z.h -= Y1; }
      if (z.x + z.w > z.targetR) z.w -= X2;
      else if (z.x + z.w < z.targetR) z.w += X2;
      if (z.y + z.h > z.targetB) z.h -= Y2;
      else if (z.y + z.h < z.targetB) z.h += Y2;
      // snap away floating-point dust so the "reached target" test is exact
      if (Math.abs(z.x - z.targetL) < 1e-9) { z.w += z.x - z.targetL; z.x = z.targetL; }
      if (Math.abs(z.y - z.targetT) < 1e-9) { z.h += z.y - z.targetT; z.y = z.targetT; }
      if (Math.abs(z.x + z.w - z.targetR) < 1e-9) z.w = z.targetR - z.x;
      if (Math.abs(z.y + z.h - z.targetB) < 1e-9) z.h = z.targetB - z.y;

      if (z.endResize !== '' && z.x === z.targetL && z.y === z.targetT &&
          z.x + z.w === z.targetR && z.y + z.h === z.targetB) {
        var f = z.endResize;
        BTS.fn.call(f);
        z.endResize = '';
      }

      // Keep the heart inside the box.
      var h = W().heart;
      if (h) {
        var hb = BTS.soul.heartBox(h, 0, 0), B = C.ZONE_BORDER;
        var half = C.HEART_SIZE / 2 + (C.FIXES.resizeUnpin ? 0.05 : 0);
        if (U.rectsOverlap(hb, { l: z.x, t: z.y, r: z.x + z.w, b: z.y + z.h }, false)) {
          if (z.x + B > hb.l) h.x = z.x + B + half;
          if (z.y + B > hb.t) h.y = z.y + B + half;
          if (z.x + z.w - B < hb.r) h.x = z.x + z.w - B - half;
          if (z.y + z.h - B < hb.b) h.y = z.y + z.h - B - half;
        }
      }
    },

    rect: function () { var z = W().zone; return { l: z.x, t: z.y, r: z.x + z.w, b: z.y + z.h }; }
  };

  BTS.zone = zone;
})(window.BTS = window.BTS || {});
