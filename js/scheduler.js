/*
 * scheduler.js - C2 "System: Wait". Callbacks run at the end of the first tick whose game time has
 * reached the target. wait(0) runs at the end of the current tick.
 */
(function (BTS) {
  'use strict';

  var pending = [];

  BTS.scheduler = {
    wait: function (seconds, cb) {
      pending.push({ at: BTS.state.time + seconds, cb: cb });
    },
    run: function () {
      var now = BTS.state.time;
      var due = [];
      for (var i = 0; i < pending.length; i++) {
        if (pending[i].at <= now + 1e-9) { due.push(pending[i]); pending.splice(i, 1); i--; }
      }
      for (var j = 0; j < due.length; j++) due[j].cb();
    },
    clear: function () { pending = []; }
  };
})(window.BTS = window.BTS || {});
