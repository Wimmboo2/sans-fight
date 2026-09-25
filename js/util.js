/*
 * util.js - small helpers that mirror Construct 2 expression semantics.
 */
(function (BTS) {
  'use strict';

  var DEG = Math.PI / 180;

  BTS.util = {
    DEG: DEG,
    // C2 int(): parseInt, NaN -> 0
    toInt: function (v) {
      if (typeof v === 'number') return v < 0 ? Math.ceil(v) : Math.floor(v);
      var n = parseInt(v, 10);
      return isNaN(n) ? 0 : n;
    },
    // C2 float(): parseFloat, NaN -> 0
    toFloat: function (v) {
      if (typeof v === 'number') return v;
      var n = parseFloat(v);
      return isNaN(n) ? 0 : n;
    },
    // C2 trig works in degrees
    // exact at multiples of 90 so axis-aligned maths has no 1e-17 noise
    sin: function (deg) {
      if (deg % 90 === 0) return [0, 1, 0, -1][(((deg / 90) % 4) + 4) % 4];
      return Math.sin(deg * DEG);
    },
    cos: function (deg) {
      if (deg % 90 === 0) return [1, 0, -1, 0][(((deg / 90) % 4) + 4) % 4];
      return Math.cos(deg * DEG);
    },
    angle: function (x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1) / DEG; },
    // normalise to [0, 360)
    normAngle: function (a) { a %= 360; if (a < 0) a += 360; return a; },
    // C2 "is within angle": difference between two angles <= within
    angleWithin: function (a, b, within) {
      var d = Math.abs(BTS.util.normAngle(a) - BTS.util.normAngle(b));
      if (d > 180) d = 360 - d;
      return d <= within;
    },
    zeropad: function (n, digits) {
      var neg = n < 0, s = String(Math.abs(n));
      while (s.length < digits) s = '0' + s;
      return (neg ? '-' : '') + s;
    },
    clamp: function (v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); },
    // Axis-aligned rectangle overlap. strict: touching edges do not count.
    rectsOverlap: function (a, b, strict) {
      if (strict) return a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
      return a.l <= b.r && a.r >= b.l && a.t <= b.b && a.b >= b.t;
    },
    pointInRect: function (x, y, r) { return x >= r.l && x <= r.r && y >= r.t && y <= r.b; },
    remove: function (arr, item) { var i = arr.indexOf(item); if (i >= 0) arr.splice(i, 1); }
  };
})(window.BTS = window.BTS || {});
