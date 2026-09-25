/*
 * functions.js - global named-function registry, the equivalent of C2's Function plugin.
 * Names are case-insensitive (C2 lowercases them). A name can have several handlers; they run in
 * registration order, like several "On function" events in an event sheet. Calling an unknown name does
 * nothing, exactly like the original.
 */
(function (BTS) {
  'use strict';

  var table = {};

  function key(name) { return String(name === undefined || name === null ? '' : name).toLowerCase(); }

  BTS.fn = {
    on: function (name, handler) {
      var k = key(name);
      (table[k] = table[k] || []).push(handler);
    },
    has: function (name) { return !!table[key(name)]; },
    // Returns the last handler's return value (C2 "Set return value").
    call: function (name) {
      var list = table[key(name)];
      if (!list) return 0;
      var args = Array.prototype.slice.call(arguments, 1), ret = 0;
      for (var i = 0; i < list.length; i++) {
        var r = list[i].apply(null, args);
        if (r !== undefined) ret = r;
      }
      return ret;
    },
    // Like call() but takes an argument array (used by the timeline).
    apply: function (name, args) {
      return BTS.fn.call.apply(null, [name].concat(args || []));
    },
    reset: function () { table = {}; }
  };
})(window.BTS = window.BTS || {});
