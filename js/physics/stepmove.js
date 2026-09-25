/*
 * stepmove.js - the C2 "Custom Movement" behaviour.
 *
 * An object has velocity (dx, dy). Each tick it moves by (dx*dt, dy*dt). With stepping mode
 * "horizontal then vertical" the horizontal part is split into round(|mx| / pxPerStep) steps (at least one),
 * and a callback runs after every step; then the vertical part does the same. A callback can call
 * stopStepping(): the object goes back to where it was before that step and the rest of that axis is skipped.
 * This is the same algorithm the original ran, so collisions land on the same sub-pixel positions.
 */
(function (BTS) {
  'use strict';

  var STOP_NONE = 0, STOP_OLD = 1, STOP_CURRENT = 2;

  function StepMover(obj, opts) {
    this.obj = obj;               // anything with x, y
    this.dx = 0;
    this.dy = 0;
    this.enabled = true;
    this.mode = opts && opts.mode || 'none'; // 'none' | 'hv'
    this.pxPerStep = opts && opts.pxPerStep || 1;
    this.onHStep = opts && opts.onHStep || null;
    this.onVStep = opts && opts.onVStep || null;
    this.cancel = STOP_NONE;
  }

  StepMover.prototype.isMoving = function () { return this.dx !== 0 || this.dy !== 0; };
  StepMover.prototype.stopStepping = function (current) { this.cancel = current ? STOP_CURRENT : STOP_OLD; };
  StepMover.prototype.stop = function () { this.dx = 0; this.dy = 0; };
  StepMover.prototype.speed = function () { return Math.sqrt(this.dx * this.dx + this.dy * this.dy); };
  // "Set speed (overall)": keeps the current angle of motion; atan2(0,0) quirks included on purpose.
  StepMover.prototype.setOverallSpeed = function (s) {
    var a = Math.atan2(this.dy, this.dx);
    this.dx = Math.cos(a) * s;
    this.dy = Math.sin(a) * s;
  };
  // "Set angle of motion": keeps the current speed.
  StepMover.prototype.setAngleOfMotion = function (deg) {
    var s = this.speed(), a = deg * Math.PI / 180;
    this.dx = Math.cos(a) * s;
    this.dy = Math.sin(a) * s;
  };
  StepMover.prototype.accelerate = function (accel, deg, dt) {
    var a = deg * Math.PI / 180;
    this.dx += Math.cos(a) * accel * dt;
    this.dy += Math.sin(a) * accel * dt;
  };

  StepMover.prototype.step = function (mx, my, cb) {
    if (mx === 0 && my === 0) return;
    var o = this.obj, sx = o.x, sy = o.y;
    var steps = Math.round(Math.sqrt(mx * mx + my * my) / this.pxPerStep);
    if (steps === 0) steps = 1;
    for (var i = 1; i <= steps; i++) {
      var f = i / steps;
      o.x = sx + mx * f;
      o.y = sy + my * f;
      if (cb) cb();
      if (this.cancel === STOP_OLD) {
        f = (i - 1) / steps;
        o.x = sx + mx * f;
        o.y = sy + my * f;
        break;
      } else if (this.cancel === STOP_CURRENT) {
        break;
      }
    }
  };

  StepMover.prototype.tick = function (dt) {
    if (!this.enabled || (this.dx === 0 && this.dy === 0)) return;
    var mx = this.dx * dt, my = this.dy * dt;
    this.cancel = STOP_NONE;
    if (this.mode === 'none') {
      this.obj.x += mx;
      this.obj.y += my;
    } else {
      this.step(mx, 0, this.onHStep);
      this.cancel = STOP_NONE;
      this.step(0, my, this.onVStep);
    }
  };

  BTS.StepMover = StepMover;
})(window.BTS = window.BTS || {});
