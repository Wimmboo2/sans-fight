/*
 * loop.js - fixed-timestep game loop. Logic always advances in steps of 1/TICK_RATE seconds;
 * rendering happens once per animation frame.
 */
(function (BTS) {
  'use strict';

  BTS.loop = {
    start: function (step, render) {
      var C = BTS.C, dt = 1 / C.TICK_RATE, acc = 0, last = null;
      function frame(now) {
        if (last === null) last = now;
        acc += Math.min(0.25, (now - last) / 1000);
        last = now;
        var n = 0;
        while (acc >= dt && n < C.MAX_STEPS_PER_FRAME) { step(dt); acc -= dt; n++; }
        if (n === C.MAX_STEPS_PER_FRAME) acc = 0;   // fell behind: drop the backlog instead of spiralling
        render();
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
  };
})(window.BTS = window.BTS || {});
