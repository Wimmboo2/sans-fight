/*
 * platforms.js - moving one-way platforms for the blue soul ("Platforms" group of Battle.xml).
 *
 * Platform(X, Y, Width, Direction, Speed, Reverse[, Acceleration])
 *   Acceleration (px/s^2) is new in this port: 0 or missing = start at full speed, like the original.
 *   sans_platforms4 / sans_platforms4hard use it (see README, "Platform acceleration").
 */
(function (BTS) {
  'use strict';

  var U;
  function W() { return BTS.world; }

  function dirVec(dir) { return [U.cos(dir * 90), U.sin(dir * 90)]; }

  var platforms = {
    init: function () { U = BTS.util; },

    create: function (x, y, w, dir, speed, reverse, accel) {
      var C = BTS.C;
      var p = {
        type: 'platform', seq: W().seq++, x: U.toInt(x), y: U.toInt(y), w: U.toInt(w), h: 7,
        dir: U.toInt(dir), speed: U.toInt(speed), reverse: U.toInt(reverse) > 0,
        accel: C.FIXES.platformAcceleration ? U.toFloat(accel) : 0, curSpeed: 0,
        damage: 0, karma: 0, color: 0
      };
      p.mover = new BTS.StepMover(p, { mode: 'none' });
      if (C.FIXES.verticalPlatforms) {
        var v = dirVec(p.dir);
        p.mover.dx = v[0] * p.speed; p.mover.dy = v[1] * p.speed;
      } else {
        // The original set the angle of motion while the speed was still 0, then set the overall speed.
        // atan2(+-0, +-0) makes directions 1 and 3 fall back to 0 and 2 (issue #135).
        p.mover.setAngleOfMotion(p.dir * 90);
        p.mover.setOverallSpeed(p.speed);
      }
      if (p.accel > 0) { p.curSpeed = 0; p.mover.dx = 0; p.mover.dy = 0; }
      W().platforms.push(p);
      return p;
    },

    repeat: function (sx, sy, w, dir, speed, count, spacing) {
      sx = U.toFloat(sx); sy = U.toFloat(sy); dir = U.toFloat(dir);
      count = U.toInt(count); spacing = U.toInt(spacing);
      for (var i = 0; i <= count - 1; i++) {
        platforms.create(sx - U.cos(dir * 90) * spacing * i, sy - U.sin(dir * 90) * spacing * i, w, dir, speed);
      }
    },

    // Behaviour step (before events): movement, including this port's optional acceleration.
    move: function (dt) {
      W().platforms.forEach(function (p) {
        if (p.accel > 0 && p.curSpeed < p.speed) {
          p.curSpeed = Math.min(p.speed, p.curSpeed + p.accel * dt);
          var v = dirVec(p.dir);
          p.mover.dx = v[0] * p.curSpeed; p.mover.dy = v[1] * p.curSpeed;
        }
        p.mover.tick(dt);
      });
    },

    // Event step: bounce off the combat zone edges.
    update: function () {
      var z = BTS.zone.rect();
      W().platforms.forEach(function (p) {
        if (!p.reverse) return;
        var turn = function (d) { p.dir = d; p.mover.setAngleOfMotion(d * 90); };
        if (p.dir === 0 && p.x + p.w >= z.r) turn(2);
        if (p.dir === 1 && p.y + p.h >= z.b) turn(3);
        if (p.dir === 2 && p.x <= z.l) turn(0);
        if (p.dir === 3 && p.y <= z.t) turn(1);
      });
    }
  };

  BTS.platforms = platforms;
})(window.BTS = window.BTS || {});
