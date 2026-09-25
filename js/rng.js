/*
 * rng.js - random numbers. Uses Math.random by default; tests can seed it for repeatable runs.
 */
(function (BTS) {
  'use strict';

  var seeded = null;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  BTS.rng = {
    seed: function (s) { seeded = (s === undefined || s === null) ? null : mulberry32(s); },
    random: function () { return seeded ? seeded() : Math.random(); },
    // C2 random(n): float in [0, n)
    range: function (n) { return BTS.rng.random() * n; },
    // C2 choose(...)
    choose: function (list) { return list[Math.floor(BTS.rng.random() * list.length)]; }
  };
})(window.BTS = window.BTS || {});
