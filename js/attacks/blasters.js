/*
 * blasters.js - Gaster Blasters: fly in, charge, fire a beam, leave ("GasterBlasters" group of Battle.xml).
 * GasterBlaster(Size, StartX, StartY, EndX, EndY, EndAngle, SpinTime, BlastTime)
 */
(function (BTS) {
  'use strict';

  var U, ENTER = 0, WAIT = 1, FIRE = 2, LEAVE = 3;
  function W() { return BTS.world; }

  var blasters = {
    init: function () { U = BTS.util; },

    create: function (size, x, y, endX, endY, endAng, spinTime, blastTime) {
      var s = new BTS.Sprite('GasterBlaster', 'Default', 0, 0);
      s.seq = W().seq++;
      s.ang = 90; s.state = ENTER; s.angle = 90; s.leaveSpeed = 0;
      s.damage = 0; s.karma = 0;
      BTS.audio.stop('GasterBlaster');
      BTS.audio.play('GasterBlaster', { tag: 'GasterBlaster' });
      BTS.audio.setRate('', 1.2);
      size = U.toInt(size);
      s.x = U.toInt(x); s.y = U.toInt(y);
      s.endX = U.toInt(endX); s.endY = U.toInt(endY); s.endAng = U.toInt(endAng);
      s.timer = U.toFloat(spinTime);
      s.beam = { visible: false, timer: 0, blastTime: U.toFloat(blastTime), baseSize: 0, sineSize: 0, opacity: 1 };
      s.hit = { visible: false, damage: 0, karma: 0, x: 0, y: 0, w: 1000, h: 16, angle: 0 };
      if (s.x === s.endX && s.y === s.endY) { s.ang = s.endAng; s.angle = s.ang; }
      if (size === 0) { s.scaleX = 2; }
      if (size === 1) { s.scaleX = 2; s.scaleY = 2; }
      if (size === 2) { s.scaleX = 3; s.scaleY = 3; }
      W().blasters.push(s);
      return s;
    },

    outsideLayout: function (s) {
      var b = s.bbox(), C = BTS.C;
      return b.r < 0 || b.l > C.WIDTH || b.b < 0 || b.t > C.HEIGHT;
    },

    update: function (dt) {
      var C = BTS.C, list = W().blasters;
      list.forEach(function (s) {
        if (s.timer > 0 && (s.state === WAIT || s.state === FIRE)) s.timer -= Math.min(dt, s.timer);
      });
      list.forEach(function (s) {
        if (s.state !== ENTER) return;
        var k = C.BLASTER_APPROACH;
        // (each "close enough" snap runs right after the lerp, in the same tick, like the original)
        if (Math.abs(s.x - s.endX) >= 3) s.x += (s.endX - s.x) * dt * k;
        if (Math.abs(s.x - s.endX) < 3) s.x = s.endX;
        if (Math.abs(s.y - s.endY) >= 3) s.y += (s.endY - s.y) * dt * k;
        if (Math.abs(s.y - s.endY) < 3) s.y = s.endY;
        if (Math.abs(s.ang - s.endAng) >= 3) s.ang += (s.endAng - s.ang) * dt * k;
        if (Math.abs(s.ang - s.endAng) < 3) s.ang = s.endAng;
        s.angle = s.ang;
        if (s.x === s.endX && s.y === s.endY && s.ang === s.endAng) s.state = WAIT;
      });
      list.forEach(function (s) {
        if (s.state === WAIT && s.timer === 0) {
          s.setAnim('Fire', true);
          s.state = FIRE;
          s.timer = C.BLASTER_FIRE_DELAY;
        }
      });
      list.forEach(function (s) {
        if (s.state === FIRE && s.timer === 0) {
          s.state = LEAVE;
          s.beam.visible = true;
          s.hit.visible = true; s.hit.damage = C.BLAST_DAMAGE; s.hit.karma = C.BLAST_KARMA;
          BTS.audio.stop('GasterBlast');
          BTS.audio.stop('GasterBlast2');
          BTS.audio.play('GasterBlast', { tag: 'GasterBlast' });
          BTS.audio.setRate('', 1.2);
          BTS.audio.play('GasterBlast2', { tag: 'GasterBlast2' });
          BTS.audio.setRate('', 1.2);
          if (s.height() > s.imageHeight()) BTS.fn.call('SansShake', 5);
        }
      });
      list.forEach(function (s) {
        if (s.state !== LEAVE) return;
        s.leaveSpeed += C.BLASTER_LEAVE_ACCEL;      // per tick, as in the original
        if (blasters.outsideLayout(s)) s.leaveSpeed = 0;
        s.x -= U.cos(s.angle) * dt * s.leaveSpeed;
        s.y -= U.sin(s.angle) * dt * s.leaveSpeed;
      });

      // Beam size animation (decompiled Undertale maths, per the original's comments).
      list.slice().forEach(function (s) {
        var b = s.beam;
        if (!b.visible) return;
        var ratio = s.height() / s.imageHeight();
        b.timer += dt;
        if (b.timer < 4 / 30) b.baseSize += Math.floor(35 * ratio / 4) * dt * 30;
        if (b.timer >= 4 / 30 && b.timer < 4 / 30 + dt) b.baseSize = 35 * ratio;
        if (b.timer > 5 / 30 + b.blastTime) {
          b.baseSize = b.baseSize * Math.pow(0.8, dt * 30);
          b.opacity = U.clamp((100 - ((b.timer - b.blastTime) * 30 - 5) * 10) / 100, 0, 1);
          if (b.baseSize <= 2) { U.remove(W().blasters, s); return; }
        }
        if (b.opacity <= 0.8) { s.hit.damage = 0; s.hit.visible = false; }
        b.sineSize = Math.sin(b.timer * 30 / 1.5) * b.baseSize / 4;
      });

      // Position the beam pieces in front of each blaster.
      W().blasters.forEach(function (s) {
        var scale = s.height() / s.imageHeight() / 2, a = U.normAngle(s.angle);
        var c = U.cos(a), sn = U.sin(a), b = s.beam;
        s.pieces = [
          { tex: 'GasterBlast3', d: 50, w: 20 * scale, h: b.baseSize / 2 + b.sineSize },
          { tex: 'GasterBlast2', d: 60, w: 10 * scale, h: b.baseSize / 1.25 + b.sineSize },
          { tex: 'GasterBlast1', d: 70, w: 1000, h: b.baseSize + b.sineSize }
        ].map(function (p) {
          return { tex: p.tex, x: s.x + c * p.d * scale, y: s.y + sn * p.d * scale, w: p.w, h: p.h, angle: a, hx: 0, hy: 0.5, opacity: b.opacity };
        });
        var h = s.hit;
        h.x = s.x + c * 70 * scale; h.y = s.y + sn * 70 * scale; h.angle = a; h.w = 1000; h.h = b.baseSize * 3 / 4;
      });
    }
  };

  BTS.blasters = blasters;
})(window.BTS = window.BTS || {});
