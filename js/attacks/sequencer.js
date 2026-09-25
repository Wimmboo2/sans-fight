/*
 * sequencer.js - the attack timeline (port of Timeline.xml). Plays attack scripts in the CSV format
 * described in the original "custom attacks" guide:
 *
 *   delay,FunctionName,arg1,arg2,...        one action per line
 *   delay,:Label                             a jump target (its delay is still honoured)
 *
 * - The delay is seconds after the previous line ran. Zero-delay lines run in the same tick.
 * - "$Name" arguments are replaced by timeline variables when the line is loaded (missing = 0).
 * - Function names are case-insensitive; unknown names are ignored, like the original.
 * - Up to 9 arguments; missing ones are passed as "".
 * - More than 1000 lines in one tick stops the attack with "Infinite loop detected".
 * - Windows (CRLF) line endings are accepted.
 */
(function (BTS) {
  'use strict';

  var MAX_ARGS = 9, MAX_LINES_PER_TICK = 1000;

  var tl = {
    running: 0,
    line: 0,
    T: 0,
    actions: [],
    cur: [],
    vars: {},
    labels: {},
    panicFunc: '',

    reset: function () {
      tl.running = 0; tl.line = 0; tl.T = 0; tl.actions = []; tl.cur = [];
      tl.vars = {}; tl.labels = {}; tl.panicFunc = '';
    },

    setPanic: function (name) { tl.panicFunc = name; },

    play: function (text) {
      text = text === undefined || text === null ? '' : String(text);
      tl.actions = text.replace(/\r/g, '').split('\n');
      tl.labels = {};
      tl.vars = { pi: Math.PI };
      tl.actions.forEach(function (line, i) {
        var tok = line.split(',')[1];
        if (tok !== undefined && tok.charAt(0) === ':') tl.labels[tok.slice(1)] = i + 1;
      });
      tl.T = 0;
      tl.line = 1;
      tl.loadLine();
      tl.running = 1;
    },

    loadLine: function () {
      var text = tl.actions[tl.line - 1];
      if (text === undefined) text = '0';
      tl.cur = text.split(',').map(function (tok) {
        if (tok.charAt(0) === '$') {
          var v = tl.vars[tok.slice(1)];
          return v === undefined ? 0 : v;
        }
        return tok;
      });
    },

    at: function (i) { var v = tl.cur[i]; return v === undefined ? '' : v; },

    pause: function () { tl.running = 0; },
    resume: function () { tl.running = 1; },
    stop: function () { tl.actions = []; tl.cur = []; tl.running = 0; },
    isRunning: function () { return tl.running; },

    panic: function (msg) {
      tl.running = 0;
      if (tl.panicFunc) BTS.fn.call(tl.panicFunc, msg);
    },

    tick: function (dt) {
      var U = BTS.util, count = 0;
      while (tl.running > 0 && tl.line > 0 && tl.line <= tl.actions.length && tl.T >= U.toFloat(tl.at(0))) {
        var name = String(tl.at(1));
        if (name.charAt(0) !== ':') {
          var args = [];
          for (var i = 0; i < MAX_ARGS; i++) args.push(tl.at(2 + i));
          BTS.fn.apply(name, args);
        }
        tl.T -= U.toFloat(tl.at(0));
        tl.line += 1;
        tl.loadLine();
        count += 1;
        if (count >= MAX_LINES_PER_TICK) {
          tl.panic('Infinite loop detected line ' + tl.line);
        }
      }
      if (tl.running > 0) tl.T += dt;
    },

    // ----- the "CPU" functions (math and jumps) -----
    jumpAbs: function (target) {
      var s = String(target);
      if (/^[0-9]+$/.test(s)) tl.line = BTS.util.toInt(s) - 1;
      else if (Object.prototype.hasOwnProperty.call(tl.labels, s)) tl.line = tl.labels[s] - 1;
      else tl.panic('Label ' + s + ' does not exist line ' + tl.line);
    }
  };

  BTS.timeline = tl;
})(window.BTS = window.BTS || {});
